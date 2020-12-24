'use strict';

const {Contract} = require('fabric-contract-api');

/** @description  Registrar organization */

class RegistrarContract extends Contract {
    /** 
     * @description Creating the unique name for Registrar organization in the network
     */ 
    constructor() {
        //Name of the smart contract 
        super('org.property-registration-network.regnet.registrar');
    }

    /* ****** All custom functions are defined below ***** */

    /**
     *  @description @description Method will be called while instantiating the smart contract to print the 
     *  success message on console and set few initial set of variables.
     * 
     *  @param {*} ctx - Transaction context object
     */
    async instantiate(ctx) {
        console.log(`Regnet: Smart Contract for Registrar Instantiated!!`);
    }

    /**
	 * @description Approve new user request made in the network by user
	 * @param {*} ctx The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} aadharId Aadhar Id of the user
	 * @returns Updated user object
	 */
    async approveNewUser(ctx, name, aadharId){
        // Enable this function only for a users and registrar node to initiate
        if (ctx.clientIdentity.getMSPID() == 'registrarMSP') {
            //Create a composite key for the user account.
            let userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

            //Fetch the user details from the ledger using the composite key
            let userBuffer = await ctx.stub
                    .getState(userKey)
                    .catch(err => console.log(err));
            
            //Update user object with the new properties
            let updatedUserObject = JSON.parse(userBuffer.toString());

            //Check if the user is already registered on the network, if yes, then reject the transaction.
            if(updatedUserObject.id === 'Approved'){
                throw new Error('Duplicated Request: User already exists on the network!!');
            } else {
                updatedUserObject.upgradCoins = parseInt(0);
                updatedUserObject.updatedAt = new Date();
                updatedUserObject.registrarId = ctx.clientIdentity.getID();
                updatedUserObject.status = 'Approved';

                //Convert the JSON Object to a Buffer and send it to the blockchain network
                let dataBuffer = Buffer.from(JSON.stringify(updatedUserObject));
                await ctx.stub.putState(userKey, dataBuffer);

                return updatedUserObject;
            }
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked from Registrar peers.`);
        }      
    }

    /**
	 * @description Method to view user details in the network
	 * @param {*} ctx The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} aadharId Aadhar Id of the user
	 */
    async viewUser(ctx, name, aadharId){
        // Enable this function only for a users and registrar node to initiate
        if (ctx.clientIdentity.getMSPID() == 'userMSP' || ctx.clientIdentity.getMSPID() == 'registrarMSP') {
            //Create a composite key for the user.
            const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

            //Fetch the current state of the user using the composite key.
            let userBuffer = await ctx.stub
                    .getState(userKey)
                    .catch(err => console.log(err));
            
            let userObject = JSON.parse(userBuffer.toString());
            return userObject;
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked from either from the Users Peers or Registrar peers.`);
        }      
    }

    /**
	 * @description Approve the property registration request by the user.  
     * @descruption This makes property status as 'registered' which means the property is trusted property in the network
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 * @returns Updated property detail
	 */
    async approvePropertyRegistration(ctx, propertyId){
        // Enable this function only for a users and registrar node to initiate
        if (ctx.clientIdentity.getMSPID() == 'registrarMSP') {
            //Create a composite key for property id
            const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

            //Fetch the request for registration using the above composite key 
            let propertyBuffer = await ctx.stub
                        .getState(propertyKey)
                        .catch(err => console.log(err));
            
            let propertyObject = JSON.parse(propertyBuffer.toString());

            //Update the property object with few more details
            propertyObject.status = 'Registered';
            propertyObject.approvedBy = ctx.clientIdentity.getID();
            propertyObject.updatedAt = new Date();

            //Update property details on the ledger
            let propertyDataBuffer = Buffer.from(JSON.stringify(propertyObject));
            await ctx.stub.putState(propertyKey, propertyDataBuffer);

            return propertyObject;
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked from Registrar peers.`);
        }
    }

    /**
	 * @description View property details available in the network.
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property 
	 * @returns Property details available in the network
	 */
    async viewProperty(ctx, propertyId){
        // Enable this function only for a users and registrar node to initiate
        if (ctx.clientIdentity.getMSPID() == 'userMSP' || ctx.clientIdentity.getMSPID() == 'registrarMSP') {
            //Create a composite key for property id
            const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

            //Using composite key fetch the current state of the property object.
            let propertyBuffer = await ctx.stub
                        .getState(propertyKey)
                        .catch(err => console.log(err));
            
            let propertyObject = JSON.parse(propertyBuffer.toString());
            return propertyObject;
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked either from Users peers or Registrar peers.`);
        }        
    }
}

//Export the class as Module
module.exports = RegistrarContract;
