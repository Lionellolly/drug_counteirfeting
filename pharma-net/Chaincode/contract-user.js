'use strict';

const {Contract} = require('fabric-contract-api');

/** @description  User organization */

class UserContract extends Contract {

    /** 
     * @description Creating the unique name for User organization in the network
     */ 
     constructor() {
         //Name of the smart contract 
         super('org.property-registration-network.regnet.users');
     }

    /* ****** All custom functions are defined below ***** */
	
	// This is a basic user defined function used at the time of instantiating the smart contract
	// to print the success message on console
	async instantiate(ctx) {
		console.log('Regnet: Smart Contract for User Instantiated!!');
    }
     
     /** 
      * @description This transaction is called by the user to request the registrar 
      * to register them on the property-registration-network. 
      * @param {*} ctx The transaction context object
	  * @param {*} name Name of the user
	  * @param {*} email Email ID of the user
	  * @param {*} phoneNumber Phone number of the user
	  * @param {*} aadharId Aadhar Id of the user
	  * @returns Returns user request object
     */
    async requestNewUser(ctx, name, email, phoneNumber, aadharId) {
        // Enable this function only for a users and registrar node to initiate.
        if(ctx.clientIdentity.getMSPID() === 'usersMSP'){
            //Here we create a new composite key for the new user account.
            const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

            //Here the user object gets stored on the blockchain.
            let newUserObj = {
                name: name,
                email: email,
                phoneNumber: phoneNumber,
                aadharId: aadharId,
                userId: ctx.clientIdentity.getID(),
                createAt: new Date(),
                updatedAt: new Date()
            };
           
            //Convert the JSON Object to a buffer and send it to store on blockchain for storage.
            let dataBuffer = Buffer.from(JSON.stringify(newUserObj));
            await ctx.stub.putState(userKey, dataBuffer);

            //Return value of the new user account created on the blockchain. 
            return newUserObj;
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked from Users peers.`);
        }

    }

     /**
	 * @description Method to recharge the account with the upgradCoins. 
     * This transaction is initiated by the user to recharge their account with ‘upgradCoins’. 
     * Here the coin is retrieved from the bankTransactionId sent in the argument
	 * @param {*} ctx  The transaction context object
	 * @param {*} name Name of the user
	 * @param {*} aadharId  Aadhar Id of the user
	 * @param {*} bankTransactionId mocked bank transaction id for this project
	 * @returns Updated user detail in the network
	 */
    async rechargeAccount(ctx, name, aadharId, bankTransactionId){
        // Enable this function only for a users and registrar node to initiate.
        if(ctx.clientIdentity.getMSPID() === 'usersMSP'){
            // Bank Transaction ID	with Number of upgradCoins
            let bankTxIdArray = [{'id':'upg500', 'value':500}, {'id':'upg1000', 'value':1000}, {'id':'upg1500', 'value':1500}];
            
            //Fetch upgradCoins based on the bank transaction id
            let txnDetails ;
            for (var i=0; i < bankTxIdArray.length; i++) {
                if (bankTxIdArray[i].id === bankTransactionId) {
                    txnDetails = bankTxIdArray[i];
                }
            }

            //create composite key for the users
            const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

            //using composite key fetch the current state of user object
            let userBuffer = await ctx.stub
                    .getState(userKey)
                    .catch(err => console.log(err));


            //validate bankTransactionId with the expected value and if the user found in the network
            if(txnDetails && userBuffer){

                //Update user object with new properties
                let userObject = JSON.parse(userBuffer.toString());
                if(userObject.status === 'Approved'){
                    userObject.upgradCoins = userObject.upgradCoins + txnDetails.value;
                    userObject.updatedAt = new Date();
        
                    // Convert the JSON object to a buffer and send it to blockchain for storage
                    let dataBuffer = Buffer.from(JSON.stringify(userObject));
                    await ctx.stub.putState(userKey, dataBuffer);
        
                    // Return value of updated  user object
                    return userObject;
        
                }
                else{ //Decline the transaction if user is not registered in the network
                    throw new Error('User should be registered on the network to recharge account');
                }
            }
            else{ //Decline the transaction if bank transaction id is invalid
                throw new Error('Invalid Transaction ID: ' + bankTransactionId );
            }
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked from Users peers.`);
        }		
	}

    /**
	 * @description View property details
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 */
     async viewUser(ctx, name, aadharId){
        // Enable this function only for a users and registrar node to initiate.
        if (ctx.clientIdentity.getMSPID() == 'usersMSP' || ctx.clientIdentity.getMSPID() == 'registrarMSP'){
            //Here we create a composite key for the user account
            const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

            //Fetch the current state of the user from the blockchain storage using the composite key.
            let userBuffer = await ctx.stub
                                    .getState(userKey)
                                    .catch(err => console.log(err));
            if(userBuffer) {
                //check if the user exists on the blockchain network or not.
                let userObj = JSON.parse(userBuffer.toString());
                return userObj;
            } else {
                throw new Error (`User not found in the network. 
                                Please check the entered user details again and retry.`);
            }
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked from either from the Users Peers or Registrar peers.`);
        }
      
    }

     /**
	 * @description Method to request to user's property to be registered in the network.
     * This function should be initiated by the user to register the details of their 
     * property on the property-registration-network.  
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 * @param {*} price Price of the property
	 * @param {*} name Name of the user (owner) who want to register their property in the network
	 * @param {*} aadharId Aadhar id of the user (owner) who want to register their property in the network
	 * @returns Propety request object
	 */
    async propertyRegistrationRequest(ctx, propertyId, price, name, aadharId){
        // Enable this function only for a users and registrar node to initiate.
        if(ctx.clientIdentity.getMSPID() === 'usersMSP'){
            //create composite key based on the user given detail 
            const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

            //Fetch the user details from the ledger using the composite key
            //Fetch the current state of user object and return
            let userBuffer = await ctx.stub
                    .getState(userKey)
                    .catch(err => console.log(err));
            
            let userObject = JSON.parse(userBuffer.toString());

            //Check if the user is registered in the network. If user is registered,
            //then proceed otherwise cancel the transaction
            if(userObject.status === 'Approved'){
                //Once we find that the user is valid, then register the property, 
                //by adding it to the ledger.
                //Use name, aadharId and propertyId to create new composite key for property
                const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

                //Create a property object to be stored in blockchain 
                let propertyObject = {
                    propertyId: propertyId,
                    owner: name+'-'+aadharId,
                    price: price,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                //Convert the JSON Object to a buffer and send it to blockchain to store the data.
                let propertyDataBuffer = Buffer.from(JSON.stringify(propertyObject));
                await ctx.stub.putState(propertyKey, propertyDataBuffer);

                //Return the value of the newly added property
                return propertyObject;
            } else {
                throw new Error(`User is not registered in the network!!`);
            }
        } else {
            throw new Error(`Invoke Function Failure: This function needs to be invoked from Users peers.`);
        }
    }

    /**
	 * @description View property details
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 */
    async viewProperty(ctx, propertyId){
        // Enable this function only for a users and registrar node to initiate.
		if (ctx.clientIdentity.getMSPID() == 'usersMSP' || ctx.clientIdentity.getMSPID() == 'registrarMSP'){
            //Create a composite key using the property id
            const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

            //using composite key fetch the current state of property object and return
            let propertyBuffer = await ctx.stub
                    .getState(propertyKey)
                    .catch(err => console.log(err));
            if(propertyBuffer){
                let propertyObject = JSON.parse(propertyBuffer.toString());
                return propertyObject;
            }
            else{
                throw new Error('Property is not found in the network');
            }
		} else {
			throw new Error(`Invoke Function Failure: This function needs to be invoked from either Users peers or Registrar peers.`);
		}
	}

    /**
	 * @description Method to update property status
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id of the property
	 * @param {*} name Name of the user who owns the property in the network
	 * @param {*} aadharId Aadhar id of the user who owns the property in the network
	 * @param {*} propertyStatus Property status to be updated 
	 */
    async updateProperty(ctx, propertyId, name, aadharId, propertyStatus){
        // Enable this function only for a users and registrar node to initiate.
		if(ctx.clientIdentity.getMSPID() === 'usersMSP'){
            //Create a composite key for the given property using the propertyId.
            const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

            //Create composite key for the given user detail using the user the name and aadharId.
            const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [name, aadharId]);

            //Fetch user details from the ledger
            let userBuffer = await ctx.stub
                    .getState(userKey)
                    .catch(err => console.log(err));
            
            let userObject = JSON.parse(userBuffer.toString());

            //Check if the user is registered, it the user is registered then proceed.
            if(userObject.status === 'Approved'){
                //Fetch the property details from the ledger
                //Use the composite key to fetch the current state of the property object and return.
                let propertyBuffer = await ctx.stub
                            .getState(propertyKey)
                            .catch(err => console.log(err));
                
                let propertyObject = JSON.parse(propertyBuffer.toString());

                //Check if the owner of the property and the request initiator are same or not.
                if(propertyObject.owner === (name + '-' + aadharId)){
                    propertyObject.status = propertyStatus;

                    //Update the property details in the ledger.
                    let propertyDataBuffer = Buffer.from(JSON.stringify(propertyObject));
                    await ctx.stub.putState(propertyKey, propertyDataBuffer);

                    // Return the update property object.
                    return propertyObject;
                } else {
                    //If the request is initiated by a different user then reject the transaction.
                    throw new Error('User not authorized to update the property details!!');
                    return false;
                } 
            } else {
                throw new Error('User not authorized to update the property details!!');
                return false;
            }
		} else {
			throw new Error(`Invoke Function Failure: This function needs to be invoked from Users peers.`);
		}      
    }

    /**
	 * @description Method to purchase property request by registered buyer in the network.  
	 * @description Buyer will be allowed to purchase only if his/her account balance is > property price
	 * @description Buyer will be allowed to purchase only if the property status is 'onSale'
     * @description If the Buyer and Seller are same then reject the request
	 * @description If all the conditions are met, then updates buyer as owner of the property and returns the details of Property, Buyer and Seller
	 * @param {*} ctx The transaction context object
	 * @param {*} propertyId Unique property id which buyer wants to purchase
	 * @param {*} buyerName name of the buyer who is registered in the network 
	 * @param {*} buyerAadharId Aadhar id of the buyer
	 */
    async purchaseProperty(ctx, propertyId, buyerName, buyerAadharId){
        // Enable this function only for a users and registrar node to initiate.
	    if(ctx.clientIdentity.getMSPID() === 'usersMSP'){
            //Create a composite key for the property to fetch property details.
            const propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users.property', [propertyId]);

            //Create a composite key for the buyer and check whether buyer is already registered in the network.
            const buyerUserKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [buyerName, buyerAadharId]);

            //Fetch user details from the ledger.
            let buyerUserBuffers = await ctx.stub
                        .getState(buyerUserKey)
                        .catch(err => console.log(err));
            
            let buyerObject = JSON.parse(buyerUserBuffers.toString());

            //Check if the user is registered on the network.
            if(buyerObject.status === 'Approved'){
                //Fetch property details from the ledger
                //Using the composite key fetch the current state of the property object
                let propertyBuffer = await ctx.stub
                            .getState(propertyKey)
                            .catch(err => console.log(err));
                let propertyObject = JSON.parse(propertyBuffer.toString());

                //Check if the buyer and seller are same. We do this by checking,
                //if the request made for the current owner of the property, then it should be declined.abs
                if(propertyObject.owner === (buyerName + '-' + buyerAadharId)){
                    throw new Error('Owner of the property cannot purchase the same property!!');
                }

                //Check if the property status is ''onSale' then proceed.
                if(propertyObject.status === 'onSale'){
                    //then check if the buyer has enough balance in the account
                    if(buyerObject.upgradCoins > propertyObject.price){
                        let ownerDetails = propertyObject.owner.split('-');
                        console.log('OWNER DETAILS:', ownerDetails);
                        
                        //Create composite key for the owner to fetch owner details.
                        const ownerUserKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.users', [ownerDetails[0], ownerDetails[1]]);

                        //Fetch owner details from the ledger.
                        let ownerUserBuffer = await ctx.stub
                                    .getState(ownerUserKey)
                                    .catch(err => console.log(err));
                        
                        let ownerObject = JSON.parse(ownerUserBuffer.toString());

                        //Deduct property price from the buyer account.
                        buyerObject.upgradCoins = parseInt(buyerObject.upgradCoins) - parseInt(propertyObject.price);
                        buyerObject.updatedAt = new Date();

                        //Update the property price in owner's account.
                        ownerObject.upgradCoins = parseInt(ownerObject.upgradCoins) + parseInt(propertyObject.price);
                        ownerObject.updatedAt = new Date();

                        //Update the owner of the newly bought property with the buyerID and the state as Registered.
                        propertyObject.owner = buyerName + '-' + buyerAadharId;
                        propertyObject.status = 'Registered';
                        propertyObject.updatedAt = new Date();

                        //Update property details on the ledger
                        let updatedProperty = Buffer.from(JSON.stringify(propertyObject));
                        await ctx.stub.putState(propertyKey, updatedProperty);

                        //Update Buyer details on the ledger
                        let updatedBuyer = Buffer.from(JSON.stringify(buyerObject));
                        await ctx.stub.putState(buyerUserKey, updatedBuyer);

                        //Update Seller(previous owner of the property) details on the ledger.
                        let updatedOwner = Buffer.from(JSON.stringify(ownerObject));
                        await ctx.stub.putState(ownerUserKey, updatedOwner);
                        
                        return (JSON.stringify(propertyObject) + JSON.stringify(buyerObject) + JSON.stringify(ownerObject));
                    } else {
                        throw new Error('Not enough balance. Please recharge your account!!');
                    }
                } else {
                    throw new Error('Property not for sale!!');
                }
            } else {
                throw new Error('User is not registered on this network!!');
            } 
	    } else {
		    throw new Error(`Invoke Function Failure: This function needs to be invoked from Users peers.`);
	    }
                   
    }
}

module.exports = UserContract;