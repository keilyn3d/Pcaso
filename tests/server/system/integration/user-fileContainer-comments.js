var mongoose             = require('mongoose');
var chai                 = require("chai");
var sinon                = require("sinon");
var sinonChai            = require("sinon-chai");
var devNullStream        = require('dev-null-stream');
var Promise              = require('bluebird');

var FileContainer        = mongoose.model('FileContainer');
var UnauthenticatedUser  = mongoose.model('UnauthenticatedUser');
var Comment              = mongoose.model('Comment');
var User                 = mongoose.model('User');
var FakeModel            = mongoose.model('FakeModel');

chai.should();
chai.use( sinonChai );

var expect = chai.expect;
var assert = chai.assert;

describe('User - FileContainer - Comments: Integration test', function(){
    
    var user1 = null;
    var user2 = null;
    var targetEntity = null;

    var fileTemplate = {
	file: {
	    name: 'test file',
	    path: './data/test/test-file.txt'
	},
	settings:{
	    fileOptions: {
		keepFile: true
	    },
	    displaySettings:{
		// null
	    }
	}
    };
    
    var userTemplate = {
	email: 'Test@cool.com',
	password: 'Super Secure'
    };
    
    var commentTemplate = {
	subject: 'test',
	body: "Hello"
    };
    
    before(function(done){
	targetEntity = new FakeModel({});
	targetEntity.save(done);
    });
    
    beforeEach( function(done){	
	
	userTemplate.name = { first: 'User 1', last: 'test subject' };
	user1 = User(userTemplate);
	userTemplate.name = { first: 'User 2', last: 'test subject' };	
	user2 = User(userTemplate);
	
	user1.save(function(err){
	    console.log( err);
	    if( err ) done( err );
	    user2.save(function(err2){

		console.log( err2);
		done();
	    });
	});
    });
    
    afterEach(function(done){
	user1.remove(function(err){
	    if( err ) return done( err );
	    user2.remove(done);
	});
    });

    it('Ensure test object exist', function(){
	expect( user1 ).to.not.be.null;
	expect( user2 ).to.not.be.null;	
    });
    
    
    it("User1 comments on User1's file", function(done){
	var spy = sinon.spy();

	function check(f){ try{ f() }catch( e ){ done(e); };};

	var comment  = null;
	var fileCntr = null;
	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	promise.then( function(fc){
	    return new Promise( function(resolve, reject){
		user1.save(function(err){
		    if( err ) reject( done, err );
		    else resolve();
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(){
	    
	    return new Promise( function(resolve, reject){
		User.findOne( { _id: user1._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(updatedUser){
	    
	    user1 = updatedUser;
	    check(function(){
		expect( user1.files.length ).to.equal( 1 );
		expect( user1.files ).to.include( fileCntr._id.toString() );
	    });
	    
	    return new Promise( function(resolve, reject){
		comment = user1.leaveComment(fileCntr, commentTemplate.subject, commentTemplate.body, function(err){    
		    if( err ) reject( done, err );
		    else resolve( comment );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function( comment ){
	    
	    // Check that parent is user1 and target is the file container
	    check(function(){
		expect( comment.parent.id ).to.equal( user1._id.toString() );
		expect( comment.parent.collectionName ).to.include( user1.__t );
		
		expect( comment.target.id ).to.equal( fileCntr._id.toString() );
		expect( comment.target.collectionName ).to.equal( fileCntr.__t );
	    });
	    
	    return new Promise( function(resolve, reject){
		
		FileContainer.findOne( { _id: fileCntr._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(fc){

	    check(function(){	    
		expect( fc.comments.length ).to.equal( 1 );
		expect( fc.comments ).to.include( comment._id );
		done();     
	    });
	}).catch( function(d,e){ d(e) });
    });
    
    it("User2 comments on User1's file", function(done){
	var spy = sinon.spy();

	function check(f){ try{ f() }catch( e ){ throw new Error( done(e) ); };};

	var comment  = null;
	var fileCntr = null;
	
	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	promise.then( function(fc){
	    return new Promise( function(resolve, reject){
		user1.save(function(err){
		    if( err ) reject( done, err );
		    else resolve();
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(){
	    
	    return new Promise( function(resolve, reject){
		User.findOne( { _id: user1._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(updatedUser){
	    
	    user1 = updatedUser;
	    check(function(){
		expect( user1.files.length ).to.equal( 1 );
		expect( user1.files ).to.include( fileCntr._id.toString() );
	    });

	    return new Promise( function(resolve, reject){
		comment = user2.leaveComment(fileCntr, commentTemplate.subject, commentTemplate.body, function(err){
		    if( err ) reject( done, err );
		    else resolve( comment );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function( comment ){
	    
	    // Check that parent is user1 and target is the file container
	    check(function(){
		expect( comment.parent.id ).to.equal( user2._id.toString() );
		expect( comment.parent.collectionName ).to.include( user2.__t );
		
		expect( comment.target.id ).to.equal( fileCntr._id.toString() );
		expect( comment.target.collectionName ).to.equal( fileCntr.__t );
	    });
	    
	    return new Promise( function(resolve, reject){
		
		FileContainer.findOne( { _id: fileCntr._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(fc){

	    check(function(){	    
		expect( fc.comments.length ).to.equal( 1 );
		expect( fc.comments ).to.include( comment._id );
		done();
	    });
	}).catch( function(d,e){console.log(e); done( e ); } );
    });

    it("User2's comments on User1's file removed when file is removed", function(done){
	var spy = sinon.spy();

	function check(f){ try{ f() }catch( e ){ throw new Error( done(e) ); };};

	var comment  = null;
	var fileCntr = null;
	
	var promise = new Promise( function(resolve, reject){
	    fileCntr = user1.registerFile(fileTemplate.file, fileTemplate.settings, function(err){
		if( err ) reject( done, err );
		else resolve( fileCntr );
	    });
	});
	
	promise.then( function(fc){
	    return new Promise( function(resolve, reject){
		user1.save(function(err){
		    if( err ) reject( done, err );
		    else resolve();
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(){
	    
	    return new Promise( function(resolve, reject){
		User.findOne( { _id: user1._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(updatedUser){
	    
	    user1 = updatedUser;
	    check(function(){
		expect( user1.files.length ).to.equal( 1 );
		expect( user1.files ).to.include( fileCntr._id.toString() );
	    });

	    return new Promise( function(resolve, reject){
		comment = user2.leaveComment(fileCntr, commentTemplate.subject, commentTemplate.body, function(err){
		    if( err ) reject( done, err );
		    else resolve( comment );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function( comment ){
	    
	    // Check that parent is user1 and target is the file container
	    check(function(){
		expect( comment.parent.id ).to.equal( user2._id.toString() );
		expect( comment.parent.collectionName ).to.include( user2.__t );
		
		expect( comment.target.id ).to.equal( fileCntr._id.toString() );
		expect( comment.target.collectionName ).to.equal( fileCntr.__t );
	    });
	    
	    return new Promise( function(resolve, reject){
		
		FileContainer.findOne( { _id: fileCntr._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(fc){
	    
	    check(function(){	    
		expect( fc.comments.length ).to.equal( 1 );
		expect( fc.comments ).to.include( comment._id );
	    });
	    
	    return new Promise( function(resolve, reject){
		
		fileCntr.remove( function(err){
		    if( err ) reject( done, err );
		    else resolve();
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(){
	    return new Promise( function(resolve, reject){
		FileContainer.findOne( { _id: fileCntr._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(fc){
	    check(function(){	    
		expect( fc ).to.not.exist;
	    });
	    
	    return new Promise( function(resolve, reject){
		User.findOne( { _id: user1._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(updatedUser){

	    user1 = updatedUser;
	    check(function(){
		expect( user1.files.length ).to.equal( 0 );
	    });

	    return new Promise( function(resolve, reject){
		User.findOne( { _id: user2._id }, function(err, doc){
		    if( err ) reject( done, err );
		    else resolve( doc );
		});
	    });
	}).catch( function(d,e){d(e)} ).then(function(updatedUser){

	    user2 = updatedUser;
	    check(function(){
		expect( user1.comments.length ).to.equal( 0 );
		done();
	    });
	}).catch( function(d,e){console.log(e); done(e);} );
    });
});


