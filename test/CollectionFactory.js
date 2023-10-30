// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.


const { expect } = require("chai");

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CollectionFactory contract", function () {
  async function deployFixture() {
    // Get the ContractFactory and Signers here.
    const CollectionFactory = await ethers.getContractFactory("CollectionFactory");
    const [owner, addr1, addr2] = await ethers.getSigners();

    const hardhatCollectionFactory = await CollectionFactory.deploy();
    // console.log(hardhatToken)

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
    it("Should create Collection", async function () {
        const { hardhatCollectionFactory, owner, addr1, addr2 } = await loadFixture(deployFixture);

        const transaction = await hardhatCollectionFactory.createCollection('XXX', 'My XXX nft')
        const transactionResult = await transaction.wait()
        const createCollectionEvent = transactionResult.events[0]

        expect(createCollectionEvent).to.haveOwnProperty('event', 'CollectionCreated')

        const collectionAddress = createCollectionEvent.args.collection

        // console.log(collection)
        console.log(collectionAddress)

        const collectionContract = await ethers.getContractAt("Collection", collectionAddress);
        expect(await collectionContract.totalSupply()).to.equal(0);

        // await collectionContract.mint()
        const tx = await hardhatCollectionFactory.mint(collectionAddress)
        const txResult = await tx.wait()
        console.log(txResult.events[1].args)

        expect(await collectionContract.totalSupply()).to.equal(1);
        expect(await collectionContract.ownerOf(0)).to.equal(owner.address);

    });
  })

});
