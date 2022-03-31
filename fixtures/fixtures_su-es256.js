
const { fromKeyLike } = require('jose/jwk/from_key_like');
const { generateKeyPair } = require('jose/util/generate_key_pair');
const { calculateThumbprint } = require('jose/jwk/thumbprint');
const { encode, decode } = require('jose/util/base64url');
const { readFileSync, writeFileSync } = require('fs');
const { GeneralSign } = require('jose/jws/general/sign');
const { parseJwk } = require('jose/jwk/parse');

const stable_key = {
    "kty": "EC",
    "x": "ONebN43-G5DOwZX6jCVpEYEe0bYd5WDybXAG0sL3iDA",
    "y": "b0MHuYfSxu3Pj4DAyDXabAc0mPjpB1worEpr3yyrft4",
    "crv": "P-256",
    "d": "jnE0-9YvxQtLJEKcyUHU6HQ3Y9nSDnh0NstYJFn7RuI"
};

const ephemeral_key = {
    "kty": "EC",
    "x": "acbIQiuMs3i8_uszEjJ2tpTtRM4EU3yz91PH6CdH2V0",
    "y": "_KcyLj9vWMptnmKtm46GqDz8wf74I5LKgrl2GzH3nSE",
    "crv": "P-256",
    "d": "Yfg5t1lo9T36QJJkrX0XiPd8Bj0Z6dt3zNqGIkyuOFc"
}

let jwp_fix = {}
try {
    jwp_fix = JSON.parse(readFileSync('draft-jmiller-json-web-proof.json'))
}catch(E){
    console.error(`fixture file loading error:`, E);
    process.exit(1)
}

// use jose wrapper
async function sign_payload(payload, key){
    const sig = new GeneralSign(decode(payload));
    sig.addSignature(key).setProtectedHeader({'alg':'ES256'});
    const jws = await sig.sign();
    return jws.signatures[0].signature;
}

function octet_array(value)
{
    if(!Array.isArray(value)) value = Array.from(new TextEncoder("utf-8").encode((value)));
    return JSON.stringify(value).split(',').join(', ')
}

(async function(){
    // generate the long-term public key
//    const signer = await generateKeyPair('ES256');
    const stable = {};
    stable.privateKey = await parseJwk(stable_key, 'ES256');
    delete stable_key.d;
    stable.publicKey = await parseJwk(stable_key, 'ES256');
    const jwk = await fromKeyLike(stable.privateKey);
//    jwk.kid = await calculateThumbprint(jwk);
    console.log('Issuer JWK:');
    console.log(JSON.stringify(jwk,0,2));
    jwp_fix.issuer_private_jwk = jwk;

    // generate the ephemeral key
//    const ephemeral = await generateKeyPair('ES256');
    const ephemeral = {};
    ephemeral.privateKey = await parseJwk(ephemeral_key, 'ES256');
    delete ephemeral_key.d;
    ephemeral.publicKey = await parseJwk(ephemeral_key, 'ES256');
    const ejwk = await fromKeyLike(ephemeral.publicKey);
    const ejwk_private = await fromKeyLike(ephemeral.privateKey);
    console.log();
    console.log('Ephemeral JWK:');
    console.log(JSON.stringify(ejwk_private,0,2));
    jwp_fix.issuer_ephemeral_jwk = jwk;

    // storage as we build up
    const sigs = [];
    const jwp = {payloads:[]};

    // create the protected header first
    const protected = {};
//    protected.kid = jwk.kid;
    protected.iss = 'https://issuer.tld';
    protected.claims = ['family_name', 'given_name', 'email', 'age']
    protected.typ = 'JPT';
    protected.proof_jwk = ejwk;
    protected.alg = 'SU-ES256';
    jwp.protected = encode(JSON.stringify(protected));
    console.log();
    console.log('Protected Header:');
    console.log(JSON.stringify(protected, 0, 2));
    console.log('octets:', octet_array(JSON.stringify(protected)));
    console.log('encoded:', jwp.protected);
    jwp_fix.jwp_protected_header = protected;
    jwp_fix.jwp_protected_header_octets = JSON.parse(octet_array(JSON.stringify(protected)));
    jwp_fix.jwp_protected_header_base64 = jwp.protected;

    // encode/sign the protected header w/ the stable key
    signature = await sign_payload(jwp.protected, stable.privateKey);
    sigs.push(signature);
    console.log('protected sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jwp_fix.jwp_protected_header_signature = JSON.parse(octet_array(Array.from(decode(signature))));
    
    // encode/sign each payload
    payload = JSON.stringify('Doe');
    encoded = encode(payload);
    jwp.payloads.push(encoded);
    signature = await sign_payload(encoded, ephemeral.privateKey);
    sigs.push(signature);
    console.log();
    console.log('payload:', encoded);
    console.log('octets:', octet_array(payload));
    console.log('sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jwp_fix.jwp_payload_0_signature = JSON.parse(octet_array(Array.from(decode(signature))));

    payload = JSON.stringify('Jay');
    encoded = encode(payload);
    jwp.payloads.push(encoded);
    signature = await sign_payload(encoded, ephemeral.privateKey);
    sigs.push(signature);
    console.log();
    console.log('payload:', encoded);
    console.log('octets:', octet_array(payload));
    console.log('sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jwp_fix.jwp_payload_1_signature = JSON.parse(octet_array(Array.from(decode(signature))));

    payload = JSON.stringify('jaydoe@example.org');
    encoded = encode(payload);
    jwp.payloads.push(encoded);
    signature = await sign_payload(encoded, ephemeral.privateKey);
    sigs.push(signature);
    console.log();
    console.log('payload:', encoded);
    console.log('octets:', octet_array(payload));
    console.log('sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jwp_fix.jwp_payload_2_signature = JSON.parse(octet_array(Array.from(decode(signature))));

    payload = JSON.stringify(42);
    encoded = encode(payload);
    jwp.payloads.push(encoded);
    signature = await sign_payload(encoded, ephemeral.privateKey);
    sigs.push(signature);
    console.log();
    console.log('payload:', encoded);
    console.log('octets:', octet_array(payload));
    console.log('sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jwp_fix.jwp_payload_3_signature = JSON.parse(octet_array(Array.from(decode(signature))));

    // merge final signature
    let final = Buffer.from([]);
    for(sig of sigs)
    {
        final = Buffer.concat([final, decode(sig)]);
    }
    jwp.proof = encode(final);
    console.log();
    console.log('final:', encode(final));
    console.log('octets:', octet_array(Array.from(final)));
    jwp_fix.jwp_signatures = JSON.parse(octet_array(Array.from(final)));

    console.log();
    console.log('JSON Serialization:');
    console.log(JSON.stringify(jwp,0,2));
    jwp_fix.jwp_final = jwp;


    const serialized = [];
    serialized.push(jwp.protected);
    serialized.push(jwp.payloads.join('~'));
    serialized.push(jwp.proof);
    console.log();
    console.log('Compact Serialization:');
    console.log(serialized.join('.'));
    jwp_fix.jwp_compact = serialized.join('.');
    
    writeFileSync('draft-jmiller-json-web-proof.json', JSON.stringify(jwp_fix, 0, 2))
})();
