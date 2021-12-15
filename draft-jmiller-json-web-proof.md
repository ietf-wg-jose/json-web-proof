%%%
title = "JSON Web Proof"
abbrev = "jwp"
docName = "draft-jmiller-json-web-proof-latest"
category = "info"
ipr = "none"
workgroup="todo"
keyword = ["jose", "zkp", "jwp", "jws"]

[seriesInfo]
name = "Internet-Draft"
value = "draft-jmiller-json-web-proof"
status = "standard"

[pi]
toc = "yes"

[[author]]
initials = "J."
surname = "Miller"
fullname = "Jeremie Miller"
organization = "Ping Identity"
  [author.address]
   email = "jmiller@pingidentity.com"

[[author]]
initials = "D."
surname = "Waite"
fullname = "David Waite"
organization = "Ping Identity"
  [author.address]
  email = "dwaite+jwp@pingidentity.com"

[[author]]
initials = "M."
surname = "Jones"
fullname = "Michael B. Jones"
organization = "Microsoft"
  [author.address]
  email = "mbj@microsoft.com"
  uri = "https://self-issued.info/"

%%%

.# Abstract

The JOSE set of standards established JSON-based container formats for [Keys](https://datatracker.ietf.org/doc/rfc7517/), [Signatures](https://datatracker.ietf.org/doc/rfc7515/), and [Encryption](https://datatracker.ietf.org/doc/rfc7516/).  They also established [IANA registries](https://www.iana.org/assignments/jose/jose.xhtml) to enable the algorithms and representations used for them to be extended.  Since those were created, newer cryptographic algorithms that support selective disclosure and unlinkability have matured and started seeing early market adoption.

This document defines a new container format similar in purpose and design to JSON Web Signature (JWS) called a _JSON Web Proof (JWP)_.  Unlike JWS, which integrity-protects only a single payload, JWP can integrity-protect multiple payloads, enabling those payloads to be selectively disclosed. It also specifies a proof-generation step, enabling privacy-preserving selection and computation.

{mainmatter}

# Introduction

The JOSE specifications are very widely deployed and well supported, enabling use of cryptographic primitives with a JSON representation.  JWTs [@!RFC7519] are one of the most common representations for identity and access claims.  For instance, they are used by the OpenID Connect and Secure Telephony Identity Revisited (STIR) standards.  Also, JWTs are used by W3C's Verifiable Credentials and are used in many Decentralized Identity systems.

With these new use cases, there is an increased focus on adopting privacy-protecting cryptographic primitives.  While such primitives are still an active area of academic and applied research, the leading candidates introduce new patterns that are not currently supported by JOSE.  These new patterns are largely focused on two areas: supporting selective disclosure when presenting information and minimizing correlation through the use of Zero-Knowledge Proofs (ZKPs), instead of traditional signatures.

There are a growing number of these cryptographic primitives that support selective disclosure while protecting privacy across multiple presentations.  Examples used in the context of Verifiable Credentials are:

* [CL Signatures](https://eprint.iacr.org/2012/562.pdf)
* [IDEMIX](http://www.zurich.ibm.com/idemix)
* [BBS+](https://github.com/mattrglobal/bbs-signatures)
* [MerkleDisclosureProof2021](https://github.com/transmute-industries/merkle-disclosure-proof-2021)
* [Mercural Signatures](https://eprint.iacr.org/2020/979)
* [PS Signatures](https://eprint.iacr.org/2015/525.pdf)
* [U-Prove](https://www.microsoft.com/en-us/research/project/u-prove/)
* [Spartan](https://github.com/microsoft/Spartan)

All of these follow the same pattern of taking multiple claims (a.k.a., "attributes" or "messages" in the literature) and binding them together into an issued token.  These are then later securely one-way transformed into a presentation that reveals potentially only a subset of the original claims, predicate proofs of the claim values, or proofs of knowledge of the claims.


# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174]
when, and only when, they appear in all capitals, as shown here.

# Background

A _JSON Web Proof (JWP)_ is very similar to a JWS [@RFC7515], with the addition that it can contain multiple individual secured payloads instead of a singular one.  JWP-supporting algorithms are then able to separate and act on the individual payloads contained within.

In addition to the JWS `sign` and `verify` interactions, JWP also importantly adds a `prove` processing step for interaction with the algorithm to perform the selective disclosure and privacy-preserving transformations.  This allows for multi-party interactions where a token is issued from one party, held by another party, then used to generate and present proofs about the token to another verifying party.  While `sign` only occurs when a JWP is being created, the `prove` and `verify` steps may be safely repeated on a signed JWP (when supported by the algorithm).

The intent of JSON Web Proofs is to establish a common container format for multiple payloads that can be integrity-verified against a cryptographic proof value also in the container.  It does not create or specify any cryptographic protocols, interaction protocols, or custom options for algorithms with additional capabilities.

Algorithm definitions that support JWPs are being done in separate companion specifications - just as the [JSON Web Algorithms] [@RFC7518] specification does for JWS and JWE [@RFC7516].  The JSON Proof Algorithms specification defines how an initial set of algorithms are used with JWP.

# JWP Format

A JWP always contains a protected header along with one or more payloads.  Each payload is represents an octet string.  The payloads are then serialized as an ordered array.  Finally, the JWP contains a representation of a cryptographic proof over the payloads.

## Protected Header

Although there are multiple payloads, the protected header still applies to the JWP as a whole.  It is recommended that payload-specific information not be included in the header and instead be handled outside of the cryptographic envelope.  This is to minimize any correlatable signals in the metadata, to prevent a verifier from categorizing based on header changes that may vary between multiple JWPs.

The JWP protected header MUST have, at minimum, an `alg` that supports proofs with signing, proving, and verifying processing steps.

For example:
```json
{
    "alg":"BBS-BLS12"
}
```

Every JWP algorithm must include a digest method that is used to generate a cryptographic hash of the base64url-serialized protected header.  The protected header cannot be selectively disclosed and the digest value MUST be included in all proof values.

In order to minimize linkability, the protected header MUST be static across all JWPs for a given key and layout.  All reused headers MUST have the same base64url-serialized value to avoid any non-deterministic JSON serialization, and the JWP algorithm's digest method MUST have a deterministic output for identical inputs.

## Payloads

Payloads are represented and processed as individual octet strings and arranged in an ordered array when there are multiple payloads.  All application context of the placement and encoding of each payload value is out of scope of this specification and SHOULD be well defined and documented by the application or other specifications.

In order to support ZKPs, individual payloads cannot be serialized before they are passed into an algorithm implementation.  This enables the algorithms to accept and internally encode elliptic curve points, blinded values, plain numbers, membership keys, etc.  Implementations therefore need to provide optional arguments for each payload such that the application can utilize these capabilities, as needed.

Any one or more payloads may be non-disclosed in a JWP.  When a payload is not disclosed, the position of other payloads does not change; the resulting array will simply be sparse and only contain the disclosed payloads.  The disclosed payloads will always be in same array positions to preserve any index-based references by the application across the whole JWP lifecycle.  How the sparse array is represented is specific to the serialization used.

## Proof

The proof value is a binary octet string that is opaque to applications.  Individual proof-supporting algorithms are responsible for the contents and security of the proof value, along with any required internal structures to it.

Implementations will need to provide optional arguments for each payload as input into the `prove` step.  These arguments can be used for generating predicate proofs, linking options, etc.

Algorithms SHOULD generate a new un-correlatable proof value during the `prove` step.  A JWP may also be single-use, where correlation across multiple derivations is not a factor.

# Serializations

Each disclosed payload MUST be base64url encoded when preparing it to be serialized.  The header and proof are also individually base64url encoded.

Like JWS, JWP supports both a Compact Serialization and a JSON Serialization.

## Compact Serialization

The individually encoded payloads are concatenated with the `~` character to form an ordered delimited array. Any non-disclosed payloads are simply left blank, resulting in sequential `~~` characters such that all payload positions are preserved.

The header, payloads, and proof are then concatenated with a `.` character to form the final compact serialization.

## JSON Serialization

Non-disclosed payloads in the JSON serialization are represented with a `null` value in the `payloads` array.

Example flattened JSON serialization:

```json
{
    "protected":"eyJhbGciOiJCQlMtQkxTMTIifQ",
    "payloads":[
        "eyJnaXZlbl9uYW1lIjoiSmFuZSIsImZhbWlseV9uYW1lIjoiRG9lIn0",
        "eyJlbWFpbCI6ImphbmVkb2VAZXhhbXBsZS5jb20ifQ",
        "eyJiaXJ0aGRhdGUiOiIwMDAwLTAzLTIyIn0"
    ],
    "proof":"F9uMuJzNBqj4j-HPTvWjUN_MNoe6KRH0818WkvDn2Sf7kg1P17YpNyzSB-CH57AWDFunU13tL8oTBDpBhODckelTxHIaEfG0rNmqmjK6DOs0_ObksTZh7W3OTbqfD2h4C_wqqMQHSWdXXnojwyFDEg"
}
```

## Example JWP

This section provides an example of a JWP.  Its computation is described in more detail in Appendix A.1, including specifying the exact octet sequences representing the JSON values used and the key value used.

The following example JWP Protected Header declares that the encoded object is a JSON Proof Token [JPT] and the JWP Protected Header and JWP Payloads are secured using the BBS+ JSON Proof Algorithm:

```json
{
  "typ": "JPT",
  "alg": "BBS+",
  "claims": [
    "family_name",
    "given_name",
    "email",
    "age"
  ]
}
```

Encoding this JWS Protected Header as BASE64URL(UTF8(JWP Protected Header)) gives this value:

```
  eyJ0eXAiOiJKUFQiLCJhbGciOiJCQlMrIiwiY2xhaW1zIjpbImZhbWlseV9uYW1lIiwiZ2l2ZW5fbmFtZSIsImVtYWlsIiwiYWdlIl19
```

The UTF-8 representation of the following JSON values are used as the JWP Payloads along with their BASE64URL(Payload) encoded form.  (Note that the JWP payloads can be any content, JSON values are used for JSON Proof Tokens.)

* `"Doe"` - `IkRvZSI`
* `"Jay"` - `IkpheSI`
* `"jaydoe@example.org"` - `ImpheWRvZUBleGFtcGxlLm9yZyI`
* `42` - `NDI`

Computing the BBS+ signature of the JWP Payloads using the key specified in Appendix A.1 and base64url-encoding the result yields this BASE64URL(JWP Proof) value:

```
  rVvDIb3QzG_--IqtdUc6FCCElEiGKu_sEKvInu65kVeIP5evELrMPaDYWbyUI2epYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i-CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx_IAvLVniyeMQ
```

Concatenating these values in the order Header.Payload1~Payload2~Payload3~Payload4.Proof with period ('.') and tilde ('~') characters between the parts yields this complete JWP representation using the JWP Compact Serialization (with line breaks for display purposes only):

```
  ImV5SjBlWEFpT2lKS1VGUWlMQ0poYkdjaU9pSkNRbE1ySWl3aVkyeGhhVzF6SWpwYkltWmhiV2xzZVY5dVlXMWxJaXdpWjJsMlpXNWZibUZ0WlNJc0ltVnRZV2xzSWl3aVlXZGxJbDE5Ig
  .
  IkRvZSI
  ~
  IkpheSI
  ~
  ImpheWRvZUBleGFtcGxlLm9yZyI
  ~
  NDI
  .rVvDIb3QzG_--IqtdUc6FCCElEiGKu_sEKvInu65kVeIP5evELrMPaDYWbyUI2epYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i-CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx_IAvLVniyeMQ
```

The same JWP using the JSON Serialization:
```json
{
  "protected": "eyJ0eXAiOiJKUFQiLCJhbGciOiJCQlMrIiwiY2xhaW1zIjpbImZhbWlseV9uYW1lIiwiZ2l2ZW5fbmFtZSIsImVtYWlsIiwiYWdlIl19",
  "payloads": [
    "IkRvZSI",
    "IkpheSI",
    "ImpheWRvZUBleGFtcGxlLm9yZyI",
    "NDI"
  ],
  "proof": "rVvDIb3QzG_--IqtdUc6FCCElEiGKu_sEKvInu65kVeIP5evELrMPaDYWbyUI2epYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i-CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx_IAvLVniyeMQ"
}
```

After using the BBS+ algorithm to generate an unlinkable proof revealing only the 2nd and 4th payload of the given name and email in this example, the result will be a new JWP with the same Protected Header only those payloads included:

```
  ImV5SjBlWEFpT2lKS1VGUWlMQ0poYkdjaU9pSkNRbE1ySWl3aVkyeGhhVzF6SWpwYkltWmhiV2xzZVY5dVlXMWxJaXdpWjJsMlpXNWZibUZ0WlNJc0ltVnRZV2xzSWl3aVlXZGxJbDE5Ig
  .
  ~
  IkpheSI
  ~
  ~
  NDI
  .AAUVrk1iHD_KnJeDoAcQDtyDRzsiFlIJQadHy6aWdyyUukBXiRf8bgtA4zcICVpMQacmrDSkJyaDbrMt7flSCu_C-pKIZ74sNXzzQyaCsam4N8K6-iYh2LVgCNf-FswgaXqLlBnUpTA29HKZKhyi0JsljtZX0H0EpDcl0CZsN9hD8uC-R8Tr5YyryCV2tRoW_VeKAAAAdLXtOduYTfnbSp38MKvd26CVNdELV7iytn-sq-3deDljBCiGSCNzVisQ21HxK0LYgwAAAAIwiazSFF9yWQUwWtzaAwN6LWbCvp-DN1bUqN8QN8Sy_kX3XXFBN_0FwuKrn_pxO2tivScDnx30mDyhZ3mfbCl_iiMhjRUzgpOeTVXAUSKlPUPlmfDnESCmd00Kvjyt9ESNvNKI4WAnBzjYNXv3s-D1AAAABDFFH9-1guu1xyZB3TIvqorcyCk0M8GAIaBHqFvYdJu9U32AkzxLcVgbJ2ALtPDuwb8ME4SZaq2apBI4pCrKJFE1fbzr3JdnuSOsYkxUflTnwa_Ex2yCXpa7LGc5rBG6pmG4N8DOOyFN1w7LYrwpPkAh1w11sO6Pg-NpmkaiAdpA
```

# Security Considerations

* Requirements for supporting algorithms, see JPA
* Application interface for verification
* Data minimization of the protected header

# IANA Considerations

This document has no IANA actions.

{backmatter}

# Acknowledgements

TBD

# Example JWPs

The following examples use algorithms defined in JSON Proof Algorithms and also contain the keys used, so that implementations can validate these samples.

# Example Single-Use JWP

This example uses the Single-Use Algorithm as defined in JSON Proof Algorithms to create a JSON Proof Token.  It demonstrates how to apply selective disclosure using an array of traditional JWS-based signatures.  Unlinkability is only achieved by using each JWP one time, as multiple uses are inherently linkable via the traditional signature embedded in the proof.

To begin we need two asymmetric keys for Single-Use, one that represents the JPT Issuer's stable key, and the other is an ephemeral key generated by the Issuer just for this JWP.

This is the Issuer's private key used in this example in the JWK format:
```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "zdT1_pfxsKxt3YJ_wv6pUcbZf9cM47ggWMbKjm9QYgg",
  "y": "zSJiqroJLpISjy2E-z3_0Zm7Ef_YvY4Irf2VyVVkiDE",
  "d": "rtR_gVUgdjFTnxTT0FBQN66iw-qqw0igequn1zEilto"
}
```

This is the ephemeral private key used in this example in the JWK format:
```json
{
  "kty": "EC",
  "crv": "P-256",
  "x": "zdT1_pfxsKxt3YJ_wv6pUcbZf9cM47ggWMbKjm9QYgg",
  "y": "zSJiqroJLpISjy2E-z3_0Zm7Ef_YvY4Irf2VyVVkiDE",
  "d": "rtR_gVUgdjFTnxTT0FBQN66iw-qqw0igequn1zEilto"
}
```

The JWP Protected Header declares that the data structure is a JPT and the JWP Proof Input is secured using the Single-Use ECDSA algorithm with the P-256 curve and SHA-256 digest.  It also includes the ephemeral public key and list of claims used for this JPT.

```json
{
  "iss": "https://issuer.example",
  "claims": [
    "family_name",
    "given_name",
    "email",
    "age"
  ],
  "typ": "JPT",
  "proof_jwk": {
    "kty": "EC",
    "crv": "P-256",
    "x": "v9PdueCsi_iSZ5loqyo6iseYPQill5DnNIv8KdDUNuw",
    "y": "QjBOXuRTiu1Qbz-G7bE67-0hLv1_cbNi8pyfYBTTwm8"
  }
}
```

After removing formatting whitespace, the octets representing UTF8(JWP Protected Header) in this example (using JSON array notation) are:

```json
[123, 34, 107, 105, 100, 34, 58, 34, 89, 54, 81, 103, 80, 97, 87, 121, 78, 104, 45, 98, 75, 56, 49, 78, 110, 87, 57, 85, 119, 74, 117, 121, 106, 84, 120, 95, 52, 73, 97, 113, 48, 118, 121, 52, 75, 74, 101, 120, 70, 104, 103, 34, 44, 34, 105, 115, 115, 34, 58, 34, 104, 116, 116, 112, 115, 58, 47, 47, 105, 115, 115, 117, 101, 114, 46, 116, 108, 100, 34, 44, 34, 99, 108, 97, 105, 109, 115, 34, 58, 91, 34, 102, 97, 109, 105, 108, 121, 95, 110, 97, 109, 101, 34, 44, 34, 103, 105, 118, 101, 110, 95, 110, 97, 109, 101, 34, 44, 34, 101, 109, 97, 105, 108, 34, 44, 34, 97, 103, 101, 34, 93, 44, 34, 116, 121, 112, 34, 58, 34, 74, 80, 84, 34, 44, 34, 112, 114, 111, 111, 102, 95, 106, 119, 107, 34, 58, 123, 34, 107, 116, 121, 34, 58, 34, 69, 67, 34, 44, 34, 120, 34, 58, 34, 74, 82, 121, 116, 72, 68, 111, 105, 70, 78, 54, 109, 115, 105, 121, 119, 113, 116, 48, 90, 115, 72, 83, 112, 122, 103, 108, 65, 108, 120, 119, 72, 45, 54, 45, 66, 65, 84, 75, 81, 82, 69, 89, 34, 44, 34, 121, 34, 58, 34, 108, 115, 121, 112, 100, 80, 45, 74, 56, 95, 98, 80, 74, 49, 104, 106, 98, 119, 116, 119, 48, 103, 48, 73, 118, 114, 79, 114, 103, 71, 66, 72, 80, 68, 109, 75, 78, 69, 51, 71, 104, 112, 119, 34, 44, 34, 99, 114, 118, 34, 58, 34, 80, 45, 50, 53, 54, 34, 125, 44, 34, 97, 108, 103, 34, 58, 34, 83, 85, 45, 69, 83, 50, 53, 54, 34, 125]
```

Encoding this JWP Protected Header as BASE64URL(UTF8(JWP Protected Header)) gives this value:
```base64
eyJraWQiOiJZNlFnUGFXeU5oLWJLODFOblc5VXdKdXlqVHhfNElhcTB2eTRLSmV4RmhnIiwiaXNzIjoiaHR0cHM6Ly9pc3N1ZXIudGxkIiwiY2xhaW1zIjpbImZhbWlseV9uYW1lIiwiZ2l2ZW5fbmFtZSIsImVtYWlsIiwiYWdlIl0sInR5cCI6IkpQVCIsInByb29mX2p3ayI6eyJrdHkiOiJFQyIsIngiOiJKUnl0SERvaUZONm1zaXl3cXQwWnNIU3B6Z2xBbHh3SC02LUJBVEtRUkVZIiwieSI6ImxzeXBkUC1KOF9iUEoxaGpid3R3MGcwSXZyT3JnR0JIUERtS05FM0docHciLCJjcnYiOiJQLTI1NiJ9LCJhbGciOiJTVS1FUzI1NiJ9
```

Each payload must also be individually encoded:

The first payload is the string `"Doe"` with the octet sequence of `[34, 68, 111, 101, 34]` and base64url-encoded as `IkRvZSI`.  

The second payload is the string `"Jay"` with the octet sequence of `[34, 74, 97, 121, 34]` and base64url-encoded as `IkpheSI`.  

The third payload is the string `"jaydoe@example.org"` with the octet sequence of `[34, 106, 97, 121, 100, 111, 101, 64, 101, 120, 97, 109, 112, 108, 101, 46, 111, 114, 103, 34]` and base64url-encoded as `ImpheWRvZUBleGFtcGxlLm9yZyI`.  

The fourth payload is the string `42` with the octet sequence of `[52, 50]` and base64url-encoded as `NDI`.  

The Single Use algorithm utilizes the ephemeral key to create multiple individual JWS Signatures.  Each signature value is generated by creating a JWS with a single Protected Header with the associated `alg` value, in this example the header used for each JWS is the JSON Object `{"alg":"ES256"}`.  The JWS payload for each varies and the resulting signature value is used in its unencoded form (the octet string, not the base64url-encoded form).

The first signature is generated by creating a JWS with the fixed header and the payload is set to the octet string of the JPT above protected header.  The resulting JWS signature is the octet string:
```json

```

This process is repeated for the JPT payloads, using their octet strings as the payload in the ephemeral JWS in order to generate a signature for each:

The first payload signature is: ` `

The second payload signature is: ` `

The third payload signature is: ` `

The fourth payload signature is: ` `

Each payload's individual signature is concatenated in order, resulting in a larger octet string with a length of an individual signature multiplied by the number of payloads.  The signature for the protected header is then also appended.  Using the above examples, the resulting octet string is:

```json
[]
```

The Issuer generates the initial JWP Proof value by then signing the above octet string with their stable key using the same process of creating a JWS with the fixed header, assigning the payload, and extracting the resulting signature.

The final proof value from the issuer is the concatenation of the array of ephemeral signatures along with the final stable signature, then base64url-encoded.

The resulting JSON Serialized JPT using the above examples is:
```json
```

The compact form of the same JPT is:
```
```



# Example Multi-Use JWP

TBD
