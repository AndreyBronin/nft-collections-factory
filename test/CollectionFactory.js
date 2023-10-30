const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CollectionFactory contract", function () {
  async function deployFixture() {
    // Get the ContractFactory and Signers here.
    const CollectionFactory = await ethers.getContractFactory("CollectionFactory");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatCollectionFactory = await CollectionFactory.deploy();

    await hardhatCollectionFactory.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { CollectionFactory, hardhatCollectionFactory, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { hardhatCollectionFactory, owner } = await loadFixture(deployFixture);

      expect(await hardhatCollectionFactory.owner()).to.equal(owner.address);
    });

  });

  describe("Collection", function () {
    it("Should create Collection and mint NFT", async function () {
        const { hardhatCollectionFactory, addr1, addr2 } = await loadFixture(deployFixture);

        const transaction = await hardhatCollectionFactory.createCollection('My XXX nft', 'XXX')
        const transactionResult = await transaction.wait()
        const createCollectionEvent = transactionResult.events[0]

        expect(createCollectionEvent).to.haveOwnProperty('event', 'CollectionCreated')

        const collectionAddress = createCollectionEvent.args.collection

        const collectionContract = await ethers.getContractAt("Collection", collectionAddress);
        expect(await collectionContract.totalSupply()).to.equal(0);

        const CollectionFactory = await ethers.getContractAt("CollectionFactory", hardhatCollectionFactory.address, addr1);

        const tx = await CollectionFactory.mint(collectionAddress)
        const txResult = await tx.wait()

        const mintedEvent = txResult.events[1]
        expect(mintedEvent).to.haveOwnProperty('event', 'TokenMinted')
        expect(mintedEvent.args).to.haveOwnProperty('recipient', addr1.address)
        expect(mintedEvent.args).to.haveOwnProperty('tokenUri', 'https://ui-avatars.com/api/?name=0')
        expect(mintedEvent.args.tokenId.toString()).to.equal('0')

        expect(await collectionContract.totalSupply()).to.equal(1);
        expect(await collectionContract.ownerOf(0)).to.equal(addr1.address);
        expect(await collectionContract.name()).to.equal('My XXX nft');
        expect(await collectionContract.symbol()).to.equal('XXX');
    });
  })

});
