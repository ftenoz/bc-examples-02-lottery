const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

//hangi ağa bağlanacağını provider ile veriyoruz.
//ganache cli ile bağlandığımı
const provider = ganache.provider();
const web3 = new Web3(provider);

const {interface, bytecode} = require('../compile');

//testlerden önce çalışacak beforeEach'de kullanılacak değişkenleri dışarıda let kullanarak tanımlıyoruz.
let accounts;
let lottery;

//bütün testlerden önce çalışacak blok
beforeEach(async ()=>{
    //bütün hesapların listesini al
    accounts = await web3.eth.getAccounts();
    
    //bu hesaplardan birini kullanarak contract'ı deploy et
   lottery = await  new web3.eth.Contract(JSON.parse(interface))
        .deploy({data:bytecode})
        .send({from:accounts[0],gas:'1000000'});
    
    lottery.setProvider(provider);

});

describe('Lottery contract',()=>{
    it('deploys a contract', ()=>{
        assert.ok(lottery.options.address);
    });

    it('should add player', async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value:web3.utils.toWei('0.02','ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from:accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it('should multiple player', async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value:web3.utils.toWei('0.02','ether')
        });
        await lottery.methods.enter().send({
            from:accounts[1],
            value:web3.utils.toWei('0.02','ether')
        });
        await lottery.methods.enter().send({
            from:accounts[2],
            value:web3.utils.toWei('0.02','ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from:accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[1], players[1]);
        assert.equal(3, players.length);
    });

    it('requires a minimum amount',async()=>{
        try{
            await lottery.methods.enter().send({
                from:accounts[0],
                value:0
            });
            assert(false);
        } catch(err){
            assert(err);
        }
    });

    it('only manager can call pickWinner',async()=>{
        try{
            await lottery.methods.pickWinner().send({
                from:accounts[1]
            });
            assert(false);
        } catch(err){
            assert(err);
        }
    });

    it('should work from end to end', async ()=>{
        await lottery.methods.enter().send({
            from:accounts[0],
            value:web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);

        await lottery.methods.pickWinner().send({from:accounts[0]});

        const finalBalance = await web3.eth.getBalance(accounts[0]);

        const difference = finalBalance - initialBalance;

        assert(difference>web3.utils.toWei('1.8','ether'));


    });


});
