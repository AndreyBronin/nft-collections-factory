const contractAddress = require("./frontend/src/contracts/contract-address.json")

const { get, set } = require("node-global-storage")
const express = require('express')
const ethers = require('ethers')
const cors = require('cors')
const ABI = require("./frontend/src/contracts/CollectionFactory.json")

set('collections', [])
set('nfts', [])

const provider = new ethers.providers.WebSocketProvider(
    'http://127.0.0.1:8545'
);

const contract = new ethers.Contract(contractAddress.CollectionFactory, ABI.abi, provider)

contract.on('CollectionCreated', (from, to, value, event)=>{
    const args = event.args
    const collection = {
        address: args[0],
        name: args[1],
        symbol: args[2]
    }

    console.log(JSON.stringify(collection, null, 4))
    set('collections', [...get('collections'), collection])
})

contract.on('TokenMinted', (from, to, value, event, event2)=>{
    const args = event2.args
    const nft = {
        address: args[0],
        recipient: args[1],
        tokenId: args[2].toString(),
        tokenUri: args[3]
    }

    console.log(JSON.stringify(nft, null, 4))
    set('nfts', [...get('nfts'), nft])
})


const app = express()
// enable CORS for testing
app.use(cors())

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.get('/collections', (req, res) => {
    res.send(JSON.stringify(get('collections')))
})

app.get('/nfts', (req, res) => {
    res.send(JSON.stringify(get('nfts')))
})

const server = app.listen(3001, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("App listening at http://%s:%s", host, port)

})