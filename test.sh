tmpdir=$(mktemp -d /tmp/alksol-bbs-0.2.1.XXXXXX) && tar -xzf fixtures/vendor/alksol-cfrg-bbs-0.2.1.tgz -C "$tmpdir" && PKG="$tmpdir/package/dist/index.js" node --input-type=module <<'EOF'
import { decode as cborDecode } from 'cbor2';
const { seed32 } = await import('file://' + process.cwd() + '/fixtures/deterministic.mjs');
const bbs = await import(`file://${process.env.PKG}`);
const keyPair = bbs.KeyPair.fromKeyMaterial(seed32('bbs:key-material:v1'));
const publicKey = bbs.PublicKey.fromBytes(keyPair.getPublicKey());
const privateCwk = cborDecode(Buffer.from(keyPair.toCoseKey()));
const publicCwk = cborDecode(Buffer.from(publicKey.toCoseKey()));
console.log({
  privateMinus1: privateCwk.get(-1),
  publicMinus1: publicCwk.get(-1)
});
EOF
