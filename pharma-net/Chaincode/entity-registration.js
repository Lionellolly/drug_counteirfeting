'use strict';

const {Contract} = require('fabric-contract-api');

/** @description  Registrar organization */

class EntityRegistration extends Contract {
    /** 
     * @description Creating the unique name for Registrar organization in the network
     */ 
    constructor() {
        //Name of the smart contract 
        super('org.pharma-network.pharmanet.');
    }

    /* ****** All custom functions are defined below ***** */

    /**
     *  @description @description Method will be called while instantiating the smart contract to print the 
     *  success message on console and set few initial set of variables.
     * 
     *  @param {*} ctx - Transaction context object
     */
    async instantiate(ctx) {
        console.log(`Pharmanet: Smart Contract for Entity Registration Instantiated!!`);
    }

    /**
	 * @description Register a new entity on the blockchain
	 * @param {*} ctx The transaction context object
	 * @param {*} companyCRN Company's unique ID
	 * @param {*} companyName Name of the company
         * @param {*} Location Where the company is located
         * @param {*} organisationRole N
	 */
    async registerCompany (ctx, companyCRN, companyName, Location, organisationRole){
     
        if (ctx.clientIdentity.getMSPID() == 'manufacturerMSP' || ctx.clientIdentity.getMSPID() == 'distributorMSP' ||
		ctx.clientIdentity.getMSPID() == 'retailerMSP' || ctx.clientIdentity.getMSPID() == 'transporterMSP') {
            
	    //Create a composite key for the user account.
            let userKey = ctx.stub.createCompositeKey('org.pharma-network.pharmanet.users', [companyCRN, companyName]);
	    
 	    let hierarchyObj = {'manufacturer':1, 'distributor':2, 'retailer':3, 'transporter': null}
            
	    //Here the user object gets stored on the blockchain.
            let newUserObj = {
                companyCRN: companyCRN,
                companyName: companyName,
                Location: Location,
                organisationRole: organisationRole,
                hierarchyKey: hierarchyObj[organisationRole]
            };
           
            //Convert the JSON Object to a buffer and send it to store on blockchain for storage.
            let dataBuffer = Buffer.from(JSON.stringify(newUserObj));
            await ctx.stub.putState(userKey, dataBuffer);
    }

//Export the class as Module
module.exports = EntityRegistration;
