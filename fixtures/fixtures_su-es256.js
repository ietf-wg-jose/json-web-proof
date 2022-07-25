
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

const holder_key = {
    "crv": "P-256",
    "kty": "EC",
    "x": "oB1TPrE_QJIL61fUOOK5DpKgd8j2zbZJtqpILDTJX6I",
    "y": "3JqnrkucLobkdRuOqZXOP9MMlbFyenFOLyGlG-FPACM",
    "d": "AvyDPl1I4xwjrI2iEOi6DxM9ipJe_h_VUN5OvoKvvW8"
}

const nonce = [185,49,1,223,189,101,214,156,214,38,94,218,124,29,48,139,65,214,80,217,53,45,239,155,10,137,133,47,22,188,43,235];

let jwp_fix = {}
try {
    jwp_fix = JSON.parse(readFileSync('draft-jmiller-jose-json-web-proof.json'))
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
    jwp_fix.issuer_ephemeral_jwk = ejwk;

    const holder = {};
    holder.privateKey = await parseJwk(holder_key, 'ES256');
    delete holder_key.d;
    holder.publicKey = await parseJwk(holder_key, 'ES256');
    const pjwk = await fromKeyLike(holder.publicKey);
    const pjwk_private = await fromKeyLike(holder.privateKey);
    console.log();
    console.log('Holder Presentation JWK:');
    console.log(JSON.stringify(pjwk_private,0,2));
    jwp_fix.holder_presentation_jwk = pjwk;

    // storage as we build up
    const sigs = [];
    const jwp = {payloads:[]};

    // create the issuer protected header first
    const issuer = {};
//    issuer.kid = jwk.kid;
    issuer.iss = 'https://issuer.tld';
    issuer.claims = ['family_name', 'given_name', 'email', 'age']
    issuer.typ = 'JPT';
    issuer.proof_jwk = ejwk;
    issuer.presentation_jwk = pjwk;
    issuer.alg = 'SU-ES256';
    jwp.issuer = encode(JSON.stringify(issuer));
    console.log();
    console.log('Issuer Protected Header:');
    console.log(JSON.stringify(issuer, 0, 2));
    console.log('octets:', octet_array(JSON.stringify(issuer)));
    console.log('encoded:', jwp.issuer);
    jwp_fix.jwp_issuer_header = issuer;
    jwp_fix.jwp_issuer_header_octets = JSON.parse(octet_array(JSON.stringify(issuer)));
    jwp_fix.jwp_issuer_header_base64 = jwp.issuer;

    // encode/sign the issuer protected header w/ the stable key
    signature = await sign_payload(jwp.issuer, stable.privateKey);
    sigs.push(signature);
    console.log('issuer protected sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jwp_fix.jwp_issuer_header_signature = JSON.parse(octet_array(Array.from(decode(signature))));
    
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
    jwp_fix.jwp_final = JSON.parse(JSON.stringify(jwp));


    const serialized = [];
    serialized.push(jwp.issuer);
    serialized.push(jwp.payloads.join('~'));
    serialized.push(jwp.proof);
    console.log();
    console.log('Compact Serialization:');
    console.log(serialized.join('.'));
    jwp_fix.jwp_compact = serialized.join('.');
    
    // presentation protected header
    const presentation = {};
    presentation.nonce = encode(nonce);
    jwp.presentation = encode(JSON.stringify(presentation));
    console.log('Presentation Protected Header:');
    console.log(JSON.stringify(presentation, 0, 2));
    console.log('octets:', octet_array(JSON.stringify(presentation)));
    console.log('encoded:', jwp.presentation);
    jwp_fix.jwp_presentation_header = presentation;
    jwp_fix.jwp_presentation_header_octets = JSON.parse(octet_array(JSON.stringify(presentation)));
    jwp_fix.jwp_presentation_header_base64 = jwp.presentation;
    // encode/sign the presentation protected header w/ the holder key
    signature = await sign_payload(jwp.presentation, holder.privateKey);
    console.log('presentation protected sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jwp_fix.jwp_presentation_header_signature = JSON.parse(octet_array(Array.from(decode(signature))));

    sigs.splice(1, 0, signature);
    sigs.splice(2+2, 1);
    sigs.splice(2+0, 1);
    jwp.payloads[0] = null;
    jwp.payloads[2] = null;
    let pres_final = Buffer.from([]);
    for(sig of sigs)
    {
        pres_final = Buffer.concat([pres_final, decode(sig)]);
    }
    jwp.proof = encode(pres_final);
    console.log();
    console.log('presentation final:', jwp.proof);
    console.log('octets:', octet_array(Array.from(pres_final)));
    jwp_fix.jwp_presentation_signatures = JSON.parse(octet_array(Array.from(pres_final)));

    console.log();
    console.log('JSON Serialization:');
    console.log(JSON.stringify(jwp,0,2));
    jwp_fix.jwp_final_presentation = JSON.parse(JSON.stringify(jwp));

    jwp.payloads[0] = '';
    jwp.payloads[2] = '';
    const pres_serialized = [];
    pres_serialized.push(jwp.issuer);
    pres_serialized.push(jwp.presentation);
    pres_serialized.push(jwp.payloads.join('~'));
    pres_serialized.push(jwp.proof);
    console.log();
    console.log('Compact Serialization:');
    console.log(pres_serialized.join('.'));
    jwp_fix.jwp_compact_presentation = pres_serialized.join('.');

    writeFileSync('draft-jmiller-jose-json-web-proof.json', JSON.stringify(jwp_fix, 0, 2))
})();
