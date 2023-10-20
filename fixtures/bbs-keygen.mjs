// generate two files (public-key.jwk and private-key.jwk)
// containing a BLS curve key pair usable for issuance, based on 
// https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-02.html
import {bbs} from "@mattrglobal/pairing-crypto"
import {encode} from "jose/util/base64url"
import fs from "fs/promises";

var keys = await bbs.bls12381_sha256.generateKeyPair();

// create "build" directory if doesn't exist
try { await fs.mkdir("build");  } catch (e) { /* ignore */ }

await fs.writeFile("build/private-key.jwk",
    JSON.stringify({
        kty: "OKP",
        alg: "BBS-DRAFT-3",
        use: "proof",
        crv: "BLs12381G2",
        x: encode(keys.publicKey),
        d: encode(keys.secretKey)
    }, null, 2));

await fs.writeFile("build/public-key.jwk",
    JSON.stringify({
        kty: "OKP",
        alg: "BBS-DRAFT-3",
        use: "proof",
        crv: "BLs12381G2",
        x: encode(keys.publicKey)
    }, null, 2));
