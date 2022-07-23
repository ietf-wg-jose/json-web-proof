
const { fromKeyLike } = require('jose/jwk/from_key_like');
const { generateKeyPair } = require('jose/util/generate_key_pair');
const { calculateThumbprint } = require('jose/jwk/thumbprint');
const { encode, decode } = require('jose/util/base64url');
const { readFileSync, writeFileSync } = require('fs');
const { GeneralSign } = require('jose/jws/general/sign');
const { parseJwk } = require('jose/jwk/parse');
const { createHmac } = require('crypto');

const stable_key = {
    "kty": "EC",
    "x": "ONebN43-G5DOwZX6jCVpEYEe0bYd5WDybXAG0sL3iDA",
    "y": "b0MHuYfSxu3Pj4DAyDXabAc0mPjpB1worEpr3yyrft4",
    "crv": "P-256",
    "d": "jnE0-9YvxQtLJEKcyUHU6HQ3Y9nSDnh0NstYJFn7RuI"
};

const shared_secret = [
    100, 109,  91, 184, 139,  20, 107,  86,
      1, 252,  86, 159, 126, 251, 228,   4,
     35, 177,  75,  96,  11, 205, 144, 189,
     42,  95, 135, 170, 107,  58,  99, 142
]

const holder_key = {
    "crv": "P-256",
    "kty": "EC",
    "x": "oB1TPrE_QJIL61fUOOK5DpKgd8j2zbZJtqpILDTJX6I",
    "y": "3JqnrkucLobkdRuOqZXOP9MMlbFyenFOLyGlG-FPACM",
    "d": "AvyDPl1I4xwjrI2iEOi6DxM9ipJe_h_VUN5OvoKvvW8"
}

const nonce = [185,49,1,223,189,101,214,156,214,38,94,218,124,29,48,139,65,214,80,217,53,45,239,155,10,137,133,47,22,188,43,235];

let jpa_fix = {}
try {
    jpa_fix = JSON.parse(readFileSync('draft-jmiller-jose-json-proof-algorithms.json'))
}catch(E){
    console.error(`fixture file loading error:`, E);
    process.exit(1)
}

// use jose wrapper
async function sign_bytes(bytes, key){
    const sig = new GeneralSign(bytes);
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
    const stable = {};
    stable.privateKey = await parseJwk(stable_key, 'ES256');
    delete stable_key.d;
    stable.publicKey = await parseJwk(stable_key, 'ES256');
    const jwk = await fromKeyLike(stable.privateKey);
//    jwk.kid = await calculateThumbprint(jwk);
    console.log('Issuer JWK:');
    console.log(JSON.stringify(jwk,0,2));
    jpa_fix.issuer_private_jwk = jwk;

    const shared_key = Buffer.from(shared_secret)
    console.log();
    console.log('Shared Secret');
    console.log(octet_array(shared_key));
    jpa_fix.mac_shared_secret = shared_secret;

    const holder = {};
    holder.privateKey = await parseJwk(holder_key, 'ES256');
    delete holder_key.d;
    holder.publicKey = await parseJwk(holder_key, 'ES256');
    const pjwk = await fromKeyLike(holder.publicKey);
    const pjwk_private = await fromKeyLike(holder.privateKey);
    console.log();
    console.log('Holder Presentation JWK:');
    console.log(JSON.stringify(pjwk_private,0,2));
    jpa_fix.holder_presentation_jwk = pjwk_private;

    // storage as we build up
    const jwp = {payloads:[]};

    // create the issuer protected header first
    const issuer = {};
//    issuer.kid = jwk.kid;
    issuer.iss = 'https://issuer.tld';
    issuer.claims = ['family_name', 'given_name', 'email', 'age']
    issuer.typ = 'JPT';
    issuer.pjwk = pjwk;
    issuer.alg = 'MAC-H256';
    jwp.issuer = encode(JSON.stringify(issuer));
    console.log();
    console.log('Issuer Protected Header:');
    console.log(JSON.stringify(issuer, 0, 2));
    console.log('octets:', octet_array(JSON.stringify(issuer)));
    console.log('encoded:', jwp.issuer);
    jpa_fix.mac_issuer_header = issuer;
    jpa_fix.mac_issuer_header_octets = JSON.parse(octet_array(JSON.stringify(issuer)));
    jpa_fix.mac_issuer_header_base64 = jwp.issuer;

    // encode/sign the issuer protected header w/ the stable key
    let ih_mac = createHmac('sha256', 'issuer_header').update(jwp.issuer).digest()
    console.log('issuer protected header mac:', octet_array(ih_mac));
    jpa_fix.mac_issuer_header_mac = JSON.parse(octet_array(Array.from(ih_mac)));

    // generate payload keys
    let payload_keys = [];
    for(i=0;i<issuer.claims.length;i++)
    {
        payload_keys[i] = createHmac('sha256', shared_key).update(String(i)).digest()
    }
    let x = payload_keys.map((item)=>Array.from(item))
    jpa_fix.mac_issuer_keys = x;

    let payload_macs = []
    let payloads = ['Doe', 'Jay', 'jaydoe@example.org', 42]
    for(i=0;i<payloads.length;i++)
    {
        // encode/hash each payload
        payload = JSON.stringify(payloads[i]);
        encoded = encode(payload);
        jwp.payloads.push(encoded);
        mac = createHmac('sha256', payload_keys[i]).update(encoded).digest()
        payload_macs.push(mac);
        console.log();
        console.log('payload:', encoded);
        console.log('octets:', octet_array(payload));
        console.log('mac octets:', octet_array(mac));
        jpa_fix[`mac_payload_${i}`] = JSON.parse(octet_array(Array.from(decode(mac))));
    }
    x = payload_macs.map((item)=>Array.from(item))
    jpa_fix.mac_issuer_macs = x;


    // merge macs for signing then append shared key for issuer proof value
    let final = ih_mac;
    for(mac of payload_macs)
    {
        final = Buffer.concat([final, mac]);
    }
    let macs_signature = await sign_bytes(final, stable.privateKey);
    jpa_fix.mac_issuer_signature = JSON.parse(octet_array(Array.from(decode(macs_signature))));
    let proof = Buffer.concat([decode(macs_signature), shared_key])
    jwp.proof = encode(proof);
    console.log();
    console.log('proof final:', jwp.proof);
    console.log('octets:', octet_array(Array.from(proof)));

    console.log();
    console.log('JSON Serialization:');
    console.log(JSON.stringify(jwp,0,2));
    jpa_fix.mac_issued_jwp = JSON.parse(JSON.stringify(jwp));


    const serialized = [];
    serialized.push(jwp.issuer);
    serialized.push(jwp.payloads.join('~'));
    serialized.push(jwp.proof);
    console.log();
    console.log('Compact Serialization:');
    console.log(serialized.join('.'));
    jpa_fix.mac_issued_compact = serialized.join('.');

    // presentation protected header
    const presentation = {};
    presentation.nonce = encode(nonce);
    jpa_fix.mac_present_nonce = JSON.parse(octet_array(Array.from(nonce)));
    jwp.presentation = encode(JSON.stringify(presentation));
    console.log('Presentation Protected Header:');
    console.log(JSON.stringify(presentation, 0, 2));
    console.log('octets:', octet_array(JSON.stringify(presentation)));
    console.log('encoded:', jwp.presentation);
    jpa_fix.mac_presentation_header = presentation;
    jpa_fix.mac_presentation_header_octets = JSON.parse(octet_array(JSON.stringify(presentation)));
    jpa_fix.mac_presentation_header_base64 = jwp.presentation;
    // encode/sign the presentation protected header w/ the holder key
    signature = await sign_bytes(decode(jwp.presentation), holder.privateKey);
    console.log('presentation protected sig:', signature);
    console.log('octets:', octet_array(Array.from(decode(signature))));
    jpa_fix.mac_presentation_header_signature = JSON.parse(octet_array(Array.from(decode(signature))));

    // 0 and 2 not disclosed
    jwp.payloads[0] = null;
    jwp.payloads[2] = null;

    // build presentation proof from issuer sig, presentation sig, then mac-or-key
    let pres_final = [decode(signature), decode(macs_signature)]
    for(i=0; i < payload_keys.length; i++)
    {
        // 0 and 2 not disclosed, include their mac instead of key
        if(i == 0 || i == 2)
            pres_final.push(payload_macs[i]);
        else
            pres_final.push(payload_keys[i]);
    }
    x = pres_final.slice(2).map((item)=>Array.from(item))
    jpa_fix.mac_presentation_keyormac = x;
    jwp.proof = encode(Buffer.concat(pres_final));
    console.log();
    console.log('presentation final:', jwp.proof);
    jpa_fix.mac_presentation_proof = JSON.parse(octet_array(Array.from(decode(jwp.proof))));

    console.log();
    console.log('JSON Serialization:');
    console.log(JSON.stringify(jwp,0,2));
    jpa_fix.mac_presentation_jwp = JSON.parse(JSON.stringify(jwp));

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
    jpa_fix.mac_presentation_compact = pres_serialized.join('.');

    writeFileSync('draft-jmiller-jose-json-proof-algorithms.json', JSON.stringify(jpa_fix, 0, 2))
})();
