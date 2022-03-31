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

This document defines a new container format similar in purpose and design to JSON Web Signature (JWS) called a _JSON Web Proof (JWP)_.  Unlike JWS, which integrity-protects only a single payload, JWP can integrity-protect multiple payloads in one message.  It also specifies a new presentation form that supports selective disclosure of individual payloads, enables additional proof computation, and adds a protected header to prevent replay and support binding mechanisms.

{mainmatter}

# Introduction

The JOSE specifications are very widely deployed and well supported, enabling use of cryptographic primitives with a JSON representation.  JWTs [@!RFC7519] are one of the most common representations for identity and access claims.  For instance, they are used by the OpenID Connect and Secure Telephony Identity Revisited (STIR) standards.  Also, JWTs are used by W3C's Verifiable Credentials and are used in many Decentralized Identity systems.

With these new use cases, there is an increased focus on adopting privacy-protecting cryptographic primitives.  While such primitives are still an active area of academic and applied research, the leading candidates introduce new patterns that are not currently supported by JOSE.  These new patterns are largely focused on two areas: supporting selective disclosure when presenting information, and minimizing correlation through the use of Zero-Knowledge Proofs (ZKPs) in addition to traditional signatures.

There are a growing number of these cryptographic primitives that support selective disclosure while protecting privacy across multiple presentations.  Examples used in the context of Verifiable Credentials are:

* [CL Signatures](https://eprint.iacr.org/2012/562.pdf)
* [IDEMIX](http://www.zurich.ibm.com/idemix)
* [BBS+](https://github.com/mattrglobal/bbs-signatures)
* [MerkleDisclosureProof2021](https://github.com/transmute-industries/merkle-disclosure-proof-2021)
* [Mercural Signatures](https://eprint.iacr.org/2020/979)
* [PS Signatures](https://eprint.iacr.org/2015/525.pdf)
* [U-Prove](https://www.microsoft.com/en-us/research/project/u-prove/)
* [Spartan](https://github.com/microsoft/Spartan)

All of these follow the same pattern of taking multiple claims (a.k.a., "attributes" or "messages" in the literature) and binding them together into a single issued token.  These are then later securely one-way transformed into a presentation that reveals potentially only a subset of the original claims, predicate proofs about the claim values, or proofs of knowledge of the claims.


# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174] when, and only when, they appear in all capitals, as shown here.

The roles of "issuer", "holder", and "verifier", are used as defined by the [Verifiable Credentials Data Model v1.1](https://www.w3.org/TR/2021/REC-vc-data-model-20211109/).  The term "presentation" is also used as defined by this source, but the term "credential" is avoided in this specification in order to minimize confusion with other definitions.

## Abbreviations

* ZKP: Zero-Knowledge Proof
* JWP: JSON Web Proof (this specification)
* JPA: JSON Proof Algorithms
* JPT: JSON Proof Token

# Background

A _JSON Web Proof (JWP)_ is very similar to a JWS [@RFC7515], with the addition that it can contain multiple individual secured payloads instead of a singular one.  JWP-supporting algorithms are then able to separate and act on the individual payloads contained within.

The intent of JSON Web Proofs is to establish a common container format for multiple payloads that can be integrity-verified against a cryptographic proof value also in the container.  It does not create or specify any cryptographic protocols, multi-party protocols, or detail any algorithm-specific capabilities.

In order to fully support the newer privacy primitives, JWP introduces the three roles of issuer, holder, and verifier as defined by the VC Data Model.  There are also two forms of a JWP: the issued form created by an issuer for a holder, and the presented form created by a holder for a verifier.

A JWP is initially created by the issuer using the `issue` interaction with an implementation.  A successful result is an issued JWP that has a single issuer-protected header, one or more payloads, and an initial proof value that contains the issuing algorithm output.  The holder, upon receiving an issued JWP, then uses `confirm` to check the integrity protection of the header and all payloads using the given proof value.

After validation, the holder uses `present` to apply any selective disclosure choices, perform privacy-preserving transformations for unlinkability, and add a presentation-protected header that ensures the resulting presented JWP cannot be replayed.  The verifier then uses `verify` to ensure the integrity protection of the protected headers and any disclosed payloads, along with verifying any additional ZKPs covering non-disclosed payloads.

While `issue` and `confirm` only occur when a JWP is initially created by the issuer, the `present` and `verify` steps may be safely repeated by a holder on an issued JWP.  The unlinkability of the resulting presented JWP is only provided when supported by the underlying algorithm.

Algorithm definitions that support JWPs are being done in separate companion specifications - just as the [JSON Web Algorithms] [@RFC7518] specification does for JWS and JWE [@RFC7516].  The JSON Proof Algorithms specification defines how an initial set of algorithms are used with JWP.

# JWP Forms

A JWP is always in one of two forms, the issued form and the presented form.  The significant difference between the two forms is the number of protected headers.  An issued JWP has only one issuer protected header, while a presented JWP will have both the issuer protected header and an additional presentation protected header.  Each protected headers is a JSON object that is serialized as a UTF-8 encoded octet string.

All JWP forms have one or more payloads; each payload is an octet string.  The payloads are arranged in an array for which the ordering is preserved in all serializations.

The JWP proof value is a single octet string that is only generated from and processed by the underlying JPA.  Internally, the proof value may contain one or more cryptographic statements that are used to check the integrity protection of the header(s) and all payloads.  Each of these statements may be a ZKP or a traditional cryptographic signature.  The algorithm is responsible for how these statements are serialized into a single proof value.

## Issued Form

When a JWP is first created it is always in the issuer form.  It will contain the issuer protected header along with all of the payloads.

The issued form can only be confirmed by a holder as being correctly formed and protected, it is NOT to be verified directly or presented as-is to a verifier.  The holder SHOULD treat an issued JWP as private and use appropriately protected storage.

### Issuer Protected Header

The issuer protected header applies to all of the payloads equally.  It is recommended that any payload-specific information not be included in this header and instead be handled outside of the cryptographic envelope.  This is to minimize any correlatable signals in the metadata, to reduce a verifier's ability to group different presentations based on small header variations from the same issuer.

Every issuer protected header MUST have, at minimum, an `alg` value that identifies a valid JPA.

For example:
```json
{
    "alg":"BBS-X"
}
```

### Issuer Payloads

Payloads are represented and processed as individual octet strings and arranged in an ordered array when there are multiple payloads.  All application context of the placement and encoding of each payload value is out of scope of this specification and SHOULD be well defined and documented by the application or other specifications.

JPAs MAY provide software interfaces that perform the encoding of individual payloads which accept native inputs such as numbers, sets, or elliptic curve points.  This enables the algorithm to support advanced features such as blinded values and predicate proofs.  These interfaces would generate the octet string encoded payload value as well as include protection of that payload in the combined proof value.

### Issuer Proof

The proof value is a binary octet string that is opaque to applications.  Individual proof-supporting algorithms are responsible for the contents and security of the proof value, along with any required internal structures.

The issuer proof is only for the holder to perform validation, checking that the issuer header and all payloads are properly encoded and protected by the given proof.

## Presented Form

When an issued JWP is presented, it undergoes a transformation that adds a presentation protected header. It may also have one or more payloads hidden, disclosing only a subset of the original issued payloads.  The proof value will always be updated to add integrity protection of the presentation header along with the necessary cryptographic statements to verify the presented JWP.

When supported by the underling JPA, a single issued JWP can be used to safely generate multiple presented JWPs without becoming correlatable.

A JWP may also be single-use, where an issued JWP can only be used once to generate a presented form, any additional presentations would be inherently correlatable.  These are still useful for applications needing only selective disclosure or where new unique issued JWPs can be retrieved easily.

### Presentation Protected Header

The presented form of a JWP MUST contain a presentation protected header.  It is added by the holder and MUST be integrity protected by the underling JPA.

This header is used to ensure a presented JWP can not be replayed and is cryptographically bound to the verifier it was presented to.

While there isn't any required values in the presentation header, it MUST contain one or more header values that uniquely identify the presented JWP to both the holder and verifier.  For example, header values that would satisfy this requirement include `nonce` and `aud`.

### Presentation Payloads

Any one or more payloads may be non-disclosed in a presented JWP.  When a payload is not disclosed, the position of other payloads does not change; the resulting array will simply be sparse and only contain the disclosed payloads.

The disclosed payloads will always be in the same array positions to preserve any index-based references by the application between the issued and presented forms of the JWP.  How the sparse array is represented is specific to the serialization used.

Algorithms MAY support including a proof about a payload in the presentation.  Applications then treat that proven payload the same as any other non-disclosed payload and not include it in the presented array of payloads.

### Presentation Proof

The proof value of a presented JWP will always be different than the issued proof.  At a minimum it MUST be updated to include protection of the added presentation header.

Algorithms SHOULD generate an un-correlatable presentation proof in order to support multiple presentations from a single issued JWP.

Any payload specific proofs are included in the single proof value for the presented JWP, the JPA is responsible for internally encoding multiple proof values into one and cryptographically binding them to a specific payload from the issuer.

# Serializations

Each disclosed payload MUST be base64url encoded when preparing it to be serialized.  The headers and proof are also individually base64url encoded.

Like JWS, JWP supports both a Compact Serialization and a JSON Serialization.

## Compact Serialization

The individually encoded payloads are concatenated with the `~` character to form an ordered delimited array. Any non-disclosed payloads are simply left blank, resulting in sequential `~~` characters such that all payload positions are preserved.

The headers, concatenated payloads, and proof value are then concatenated with a `.` character to form the final compact serialization.  The issued form will only contain one header and always have three `.` separated parts.  The presented form will always have four `.` separated parts, the issued header, followed by the protected header, then the payloads and the proof.

## JSON Serialization

Non-disclosed payloads in the JSON serialization are represented with a `null` value in the `payloads` array.

Example flattened JSON serialization showing the presentation form with both the issuer and presentation headers along with the second payload hidden.

```json
{
    "issuer":"eyJhbGciOiJCQlMtQkxTMTIifQ",
    "presentation":"eyJlbWFpbCI6ImphbmVkb2VAZXhhbXBsZS5jb20ifQ",
    "payloads":[
        "eyJnaXZlbl9uYW1lIjoiSmFuZSIsImZhbWlseV9uYW1lIjoiRG9lIn0",
        null,
        "eyJiaXJ0aGRhdGUiOiIwMDAwLTAzLTIyIn0"
    ],
    "proof":"F9uMuJzNBqj4j-HPTvWjUN_MNoe6KRH0818WkvDn2Sf7kg1P17YpNyzSB-CH57AWDFunU13tL8oTBDpBhODckelTxHIaEfG0rNmqmjK6DOs0_ObksTZh7W3OTbqfD2h4C_wqqMQHSWdXXnojwyFDEg"
}
```

## Example JWP

This section provides an example of a JWP secured using the BBS JSON Proof Algorithm [JPA].  Its computation is described in more detail in the JPA BBS definition, including specifying the exact octet sequences representing the JSON values used and the key value used.

The following example JWP Protected Header declares that the encoded object is a JSON Proof Token [JPT] and the JWP Protected Header and JWP Payloads are secured using the BBS JSON Proof Algorithm [JPA]:

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
  "alg": "BBS-X"
}
```

Encoding this JWS Protected Header as BASE64URL(UTF8(JWP Protected Header)) gives this value:

```
  eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlIiwiY2xhaW1zIjpbImZhbWlseV9uYW1lIiwiZ2l2ZW5fbmFtZSIsImVtYWlsIiwiYWdlIl0sInR5cCI6IkpQVCIsImFsZyI6IkJCUy1YIn0
```

The UTF-8 representation of the following JSON values are used as the JWP Payloads along with their BASE64URL(Payload) encoded form.  (Note that the JWP payloads can be any content, JSON values are used for JSON Proof Tokens.)

* `"Doe"` - `IkRvZSI`
* `"Jay"` - `IkpheSI`
* `"jaydoe@example.org"` - `ImpheWRvZUBleGFtcGxlLm9yZyI`
* `42` - `NDI`

Computing the BBS signature of the JWP Payloads using the key specified in Appendix A.1 and base64url-encoding the result yields this BASE64URL(JWP Proof) value:

```
  gwho74MFtojkf2qEBFHsJCBZgeCV9dNRIXacM5QAzvqTb2wNTARiChTGF9wlEJwFYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i-CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx_IAvLVniyeMQ
```

Concatenating these values in the order Header.Payload1~Payload2~Payload3~Payload4.Proof with period ('.') and tilde ('~') characters between the parts yields this complete JWP representation using the JWP Compact Serialization (with line breaks for display purposes only):

```
  eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlIiwiY2xhaW1zIjpbImZhbWlseV9uYW1lIiwiZ2l2ZW5fbmFtZSIsImVtYWlsIiwiYWdlIl0sInR5cCI6IkpQVCIsImFsZyI6IkJCUy1YIn0
  .
  IkRvZSI
  ~
  IkpheSI
  ~
  ImpheWRvZUBleGFtcGxlLm9yZyI
  ~
  NDI
  .gwho74MFtojkf2qEBFHsJCBZgeCV9dNRIXacM5QAzvqTb2wNTARiChTGF9wlEJwFYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i-CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx_IAvLVniyeMQ
```

The same JWP using the JSON Serialization:
```json
{
  "issuer": "eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlIiwiY2xhaW1zIjpbImZhbWlseV9uYW1lIiwiZ2l2ZW5fbmFtZSIsImVtYWlsIiwiYWdlIl0sInR5cCI6IkpQVCIsImFsZyI6IkJCUy1YIn0",
  "payloads": [
    "IkRvZSI",
    "IkpheSI",
    "ImpheWRvZUBleGFtcGxlLm9yZyI",
    "NDI"
  ],
  "proof": "gwho74MFtojkf2qEBFHsJCBZgeCV9dNRIXacM5QAzvqTb2wNTARiChTGF9wlEJwFYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i-CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx_IAvLVniyeMQ"
}
```

After using the BBS algorithm to generate an unlinkable proof revealing only the second and fourth payload of the given name and email in this example, the result will be a new JWP with the same Protected Header only those payloads included:

```
  eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlIiwiY2xhaW1zIjpbImZhbWlseV9uYW1lIiwiZ2l2ZW5fbmFtZSIsImVtYWlsIiwiYWdlIl0sInR5cCI6IkpQVCIsImFsZyI6IkJCUy1YIn0
  .
  eyJlbWFpbCI6ImphbmVkb2VAZXhhbXBsZS5jb20ifQ
  .
  ~
  IkpheSI
  ~
  ~
  NDI
  .AAUVjPocNVq54AMOOTR6fTi4k09p7ksDON8TbKXSwFpGJpPxIpb9CieH0IgE4Hcnd8m6sO8DAPWSuNO_BPWD156pYvhMPIGnPPglOTvZTnuuReKJZrxfhdDz1WSDmgvzx1TvsZDG5lqBSGTIsFksJNYp2qgKt4MKvJHMcsbVEj28HYmXLDR94HyQPyJYDAbKBGpWAAAAdJek-dySicKLY8WgJ8reG3jB-QKw1XIL5IxSJ0O61KeOeGArhTcnDB9vC6KdsgbixgAAAAJSbCyDkZYSnVcQsfjAj2K2RIUKkuqMQ9lapfEyj4lvbCyZTjmmmIbII5MM-w7Mlif9Np2Vp3-KKEB1J1H138IYlHvlbfSga43fMjrRNDflVwB5kq4zBIMI3o4e7l60oB2PmevDr8DwK0hXJCgBmqThAAAABAw5WfKp81ieomSR1anW498WkmUiT60BtVMbU291LMTlOxgk7KGYUbV5Ezy5z4WMfV6-Ll4R2pjy3Vfvrvm46sdIz-fHxqOiKqICMoOdl7NrLJ01k2PUclaszoogX7NN_xKuN5-SsequvK2Ysa2oREPbXZDNEMlku0eWX5cWR5sq
```

# Security Considerations

* Requirements for supporting algorithms, see JPA
* Application interface for verification
* Data minimization of the protected header
* In order to prevent accidentally introducing linkability, when an issuer uses the same key with the same grouping of payload types they SHOULD also use the same issuer protected header.  Each of these headers SHOULD have the same base64url-serialized value to avoid any non-deterministic JSON serialization.


# IANA Considerations

This document has no IANA actions.

{backmatter}

# Example JWPs

The following examples use algorithms defined in JSON Proof Algorithms and also contain the keys used, so that implementations can validate these samples.

## Example Single-Use JWP

This example uses the Single-Use Algorithm as defined in JSON Proof Algorithms to create a JSON Proof Token.  It demonstrates how to apply selective disclosure using an array of traditional JWS-based signatures.  Unlinkability is only achieved by using each JWP one time, as multiple uses are inherently linkable via the traditional signature embedded in the proof.

To begin we need two asymmetric keys for Single-Use, one that represents the JPT signers's stable key, and the other is an ephemeral key generated by the Signer just for this JWP.

This is the Signer's stable private key used in this example in the JWK format:
```json issuer_private_jwk
{
  "crv": "P-256",
  "kty": "EC",
  "x": "ONebN43-G5DOwZX6jCVpEYEe0bYd5WDybXAG0sL3iDA",
  "y": "b0MHuYfSxu3Pj4DAyDXabAc0mPjpB1worEpr3yyrft4",
  "d": "jnE0-9YvxQtLJEKcyUHU6HQ3Y9nSDnh0NstYJFn7RuI"
}
```

This is the ephemeral private key used in this example in the JWK format:
```json issuer_ephemeral_jwk
{
  "crv": "P-256",
  "kty": "EC",
  "x": "ONebN43-G5DOwZX6jCVpEYEe0bYd5WDybXAG0sL3iDA",
  "y": "b0MHuYfSxu3Pj4DAyDXabAc0mPjpB1worEpr3yyrft4",
  "d": "jnE0-9YvxQtLJEKcyUHU6HQ3Y9nSDnh0NstYJFn7RuI"
}
```

The JWP Protected Header declares that the data structure is a JPT and the JWP Proof Input is secured using the Single-Use ECDSA algorithm with the P-256 curve and SHA-256 digest.  It also includes the ephemeral public key and list of claims used for this JPT.

```json jwp_protected_header
{
  "iss": "https://issuer.tld",
  "claims": [
    "family_name",
    "given_name",
    "email",
    "age"
  ],
  "typ": "JPT",
  "proof_jwk": {
    "crv": "P-256",
    "kty": "EC",
    "x": "acbIQiuMs3i8_uszEjJ2tpTtRM4EU3yz91PH6CdH2V0",
    "y": "_KcyLj9vWMptnmKtm46GqDz8wf74I5LKgrl2GzH3nSE"
  },
  "alg": "SU-ES256"
}
```

After removing formatting whitespace, the octets representing UTF8(JWP Protected Header) in this example (using JSON array notation) are:

```json jwp_protected_header_octets
[123, 34, 105, 115, 115, 34, 58, 34, 104, 116, 116, 112, 115, 58, 47, 47, 105, 115, 115, 117, 101, 114, 46, 116, 108, 100, 34, 44, 34, 99, 108, 97, 105, 109, 115, 34, 58, 91, 34, 102, 97, 109, 105, 108, 121, 95, 110, 97, 109, 101, 34, 44, 34, 103, 105, 118, 101, 110, 95, 110, 97, 109, 101, 34, 44, 34, 101, 109, 97, 105, 108, 34, 44, 34, 97, 103, 101, 34, 93, 44, 34, 116, 121, 112, 34, 58, 34, 74, 80, 84, 34, 44, 34, 112, 114, 111, 111, 102, 95, 106, 119, 107, 34, 58, 123, 34, 99, 114, 118, 34, 58, 34, 80, 45, 50, 53, 54, 34, 44, 34, 107, 116, 121, 34, 58, 34, 69, 67, 34, 44, 34, 120, 34, 58, 34, 97, 99, 98, 73, 81, 105, 117, 77, 115, 51, 105, 56, 95, 117, 115, 122, 69, 106, 74, 50, 116, 112, 84, 116, 82, 77, 52, 69, 85, 51, 121, 122, 57, 49, 80, 72, 54, 67, 100, 72, 50, 86, 48, 34, 44, 34, 121, 34, 58, 34, 95, 75, 99, 121, 76, 106, 57, 118, 87, 77, 112, 116, 110, 109, 75, 116, 109, 52, 54, 71, 113, 68, 122, 56, 119, 102, 55, 52, 73, 53, 76, 75, 103, 114, 108, 50, 71, 122, 72, 51, 110, 83, 69, 34, 125, 44, 34, 97, 108, 103, 34, 58, 34, 83, 85, 45, 69, 83, 50, 53, 54, 34, 125]
```

Encoding this JWP Protected Header as BASE64URL(UTF8(JWP Protected Header)) gives this value:
```text jwp_protected_header_base64
eyJpc3MiOiJodHRwczovL2lzc3Vlci50bGQiLCJjbGFpbXMiOlsiZmFtaWx5X25hbWUiLCJnaXZlbl9uYW1lIiwiZW1haWwiLCJhZ2UiXSwidHlwIjoiSlBUIiwicHJvb2ZfandrIjp7ImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ4IjoiYWNiSVFpdU1zM2k4X3VzekVqSjJ0cFR0Uk00RVUzeXo5MVBINkNkSDJWMCIsInkiOiJfS2N5TGo5dldNcHRubUt0bTQ2R3FEejh3Zjc0STVMS2dybDJHekgzblNFIn0sImFsZyI6IlNVLUVTMjU2In0
```

Each payload must also be individually encoded:

The first payload is the string `"Doe"` with the octet sequence of `[34, 68, 111, 101, 34]` and base64url-encoded as `IkRvZSI`.  

The second payload is the string `"Jay"` with the octet sequence of `[34, 74, 97, 121, 34]` and base64url-encoded as `IkpheSI`.  

The third payload is the string `"jaydoe@example.org"` with the octet sequence of `[34, 106, 97, 121, 100, 111, 101, 64, 101, 120, 97, 109, 112, 108, 101, 46, 111, 114, 103, 34]` and base64url-encoded as `ImpheWRvZUBleGFtcGxlLm9yZyI`.  

The fourth payload is the string `42` with the octet sequence of `[52, 50]` and base64url-encoded as `NDI`.  

The Single Use algorithm utilizes multiple individual JWS Signatures.  Each signature value is generated by creating a JWS with a single Protected Header with the associated `alg` value, in this example the fixed header used for each JWS is the serialized JSON Object `{"alg":"ES256"}`.  The JWS payload for each varies and the resulting signature value is used in its unencoded form (the octet string, not the base64url-encoded form).

The first signature is generated by creating a JWS using the fixed header with the payload set to the octet string of the JPT protected header from earlier.  The resulting JWS signature using the Signer's *stable key* is the octet string of:
```json jwp_protected_header_signature
[142, 229, 21, 142, 132, 41, 68, 245, 171, 211, 79, 198, 53, 26, 153, 28, 6, 243, 133, 26, 151, 170, 236, 129, 132, 244, 192, 2, 117, 218, 215, 86, 158, 134, 26, 108, 213, 89, 195, 238, 215, 107, 172, 114, 123, 143, 49, 255, 158, 105, 29, 222, 63, 202, 58, 145, 10, 118, 173, 128, 116, 55, 138, 166]
```

This process is repeated for the JPT payloads, using their octet strings as the payload in the ephemeral JWS in order to generate a signature using the *epehemeral key* for each:

The first payload signature is: 
```json jwp_payload_0_signature
[79, 79, 101, 15, 72, 1, 209, 97, 224, 217, 166, 111, 88, 46, 108, 232, 39, 117, 106, 255, 26, 74, 81, 21, 40, 127, 241, 218, 161, 204, 54, 26, 19, 165, 201, 91, 46, 246, 184, 175, 159, 30, 27, 236, 101, 213, 138, 63, 191, 37, 26, 147, 236, 62, 87, 88, 149, 129, 90, 60, 190, 134, 19, 47]
```

The second payload signature is: 
```json jwp_payload_1_signature
[229, 147, 79, 149, 28, 60, 248, 37, 141, 169, 31, 108, 34, 101, 136, 212, 140, 246, 101, 239, 146, 229, 132, 131, 174, 62, 222, 204, 64, 7, 65, 253, 153, 164, 134, 63, 36, 148, 254, 28, 136, 196, 248, 52, 211, 186, 141, 159, 14, 49, 195, 177, 103, 204, 65, 113, 170, 216, 181, 209, 201, 197, 89, 92]
```

The third payload signature is: 
```json jwp_payload_2_signature
[141, 28, 241, 179, 207, 174, 86, 201, 225, 191, 251, 18, 130, 11, 219, 42, 152, 233, 83, 174, 214, 155, 124, 140, 167, 101, 80, 107, 108, 171, 9, 103, 29, 76, 10, 60, 245, 21, 26, 112, 98, 159, 165, 140, 133, 82, 22, 206, 230, 148, 47, 57, 151, 108, 240, 96, 190, 132, 27, 251, 125, 123, 56, 174]
```

The fourth payload signature is: 
```json jwp_payload_3_signature
[14, 255, 206, 58, 239, 42, 242, 155, 13, 98, 189, 10, 28, 195, 161, 135, 81, 33, 172, 246, 109, 181, 177, 178, 94, 71, 208, 105, 178, 10, 148, 15, 75, 207, 111, 12, 175, 220, 201, 185, 157, 72, 48, 208, 156, 74, 187, 31, 120, 118, 165, 81, 135, 63, 110, 78, 120, 83, 205, 32, 104, 22, 202, 122]
```

Each payload's individual signature is concatenated in order, resulting in a larger octet string with a length of an individual signature (64 octets for ES256) multiplied by the number of payloads (4 for this example).  These payload ephemeral signatures are then appended to the initial protected header stable signature.  Using the above examples, the resulting octet string is 320 in length (`5 * 64`):

```json jwp_signatures
[142, 229, 21, 142, 132, 41, 68, 245, 171, 211, 79, 198, 53, 26, 153, 28, 6, 243, 133, 26, 151, 170, 236, 129, 132, 244, 192, 2, 117, 218, 215, 86, 158, 134, 26, 108, 213, 89, 195, 238, 215, 107, 172, 114, 123, 143, 49, 255, 158, 105, 29, 222, 63, 202, 58, 145, 10, 118, 173, 128, 116, 55, 138, 166, 79, 79, 101, 15, 72, 1, 209, 97, 224, 217, 166, 111, 88, 46, 108, 232, 39, 117, 106, 255, 26, 74, 81, 21, 40, 127, 241, 218, 161, 204, 54, 26, 19, 165, 201, 91, 46, 246, 184, 175, 159, 30, 27, 236, 101, 213, 138, 63, 191, 37, 26, 147, 236, 62, 87, 88, 149, 129, 90, 60, 190, 134, 19, 47, 229, 147, 79, 149, 28, 60, 248, 37, 141, 169, 31, 108, 34, 101, 136, 212, 140, 246, 101, 239, 146, 229, 132, 131, 174, 62, 222, 204, 64, 7, 65, 253, 153, 164, 134, 63, 36, 148, 254, 28, 136, 196, 248, 52, 211, 186, 141, 159, 14, 49, 195, 177, 103, 204, 65, 113, 170, 216, 181, 209, 201, 197, 89, 92, 141, 28, 241, 179, 207, 174, 86, 201, 225, 191, 251, 18, 130, 11, 219, 42, 152, 233, 83, 174, 214, 155, 124, 140, 167, 101, 80, 107, 108, 171, 9, 103, 29, 76, 10, 60, 245, 21, 26, 112, 98, 159, 165, 140, 133, 82, 22, 206, 230, 148, 47, 57, 151, 108, 240, 96, 190, 132, 27, 251, 125, 123, 56, 174, 14, 255, 206, 58, 239, 42, 242, 155, 13, 98, 189, 10, 28, 195, 161, 135, 81, 33, 172, 246, 109, 181, 177, 178, 94, 71, 208, 105, 178, 10, 148, 15, 75, 207, 111, 12, 175, 220, 201, 185, 157, 72, 48, 208, 156, 74, 187, 31, 120, 118, 165, 81, 135, 63, 110, 78, 120, 83, 205, 32, 104, 22, 202, 122]
```

The final Proof value from the Signer is the concatenated array of the header signature followed by all of the payload signatures, then base64url encoded.

The resulting JSON Serialized JPT using the above examples is:
```json jwp_final
{
  "payloads": [
    "IkRvZSI",
    "IkpheSI",
    "ImpheWRvZUBleGFtcGxlLm9yZyI",
    "NDI"
  ],
  "protected": "eyJpc3MiOiJodHRwczovL2lzc3Vlci50bGQiLCJjbGFpbXMiOlsiZmFtaWx5X25hbWUiLCJnaXZlbl9uYW1lIiwiZW1haWwiLCJhZ2UiXSwidHlwIjoiSlBUIiwicHJvb2ZfandrIjp7ImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ4IjoiYWNiSVFpdU1zM2k4X3VzekVqSjJ0cFR0Uk00RVUzeXo5MVBINkNkSDJWMCIsInkiOiJfS2N5TGo5dldNcHRubUt0bTQ2R3FEejh3Zjc0STVMS2dybDJHekgzblNFIn0sImFsZyI6IlNVLUVTMjU2In0",
  "proof": "juUVjoQpRPWr00_GNRqZHAbzhRqXquyBhPTAAnXa11aehhps1VnD7tdrrHJ7jzH_nmkd3j_KOpEKdq2AdDeKpk9PZQ9IAdFh4Nmmb1gubOgndWr_GkpRFSh_8dqhzDYaE6XJWy72uK-fHhvsZdWKP78lGpPsPldYlYFaPL6GEy_lk0-VHDz4JY2pH2wiZYjUjPZl75LlhIOuPt7MQAdB_Zmkhj8klP4ciMT4NNO6jZ8OMcOxZ8xBcarYtdHJxVlcjRzxs8-uVsnhv_sSggvbKpjpU67Wm3yMp2VQa2yrCWcdTAo89RUacGKfpYyFUhbO5pQvOZds8GC-hBv7fXs4rg7_zjrvKvKbDWK9ChzDoYdRIaz2bbWxsl5H0GmyCpQPS89vDK_cybmdSDDQnEq7H3h2pVGHP25OeFPNIGgWyno"
}
```

The compact form of the same JPT is:
```text jwp_compact
eyJpc3MiOiJodHRwczovL2lzc3Vlci50bGQiLCJjbGFpbXMiOlsiZmFtaWx5X25hbWUiLCJnaXZlbl9uYW1lIiwiZW1haWwiLCJhZ2UiXSwidHlwIjoiSlBUIiwicHJvb2ZfandrIjp7ImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ4IjoiYWNiSVFpdU1zM2k4X3VzekVqSjJ0cFR0Uk00RVUzeXo5MVBINkNkSDJWMCIsInkiOiJfS2N5TGo5dldNcHRubUt0bTQ2R3FEejh3Zjc0STVMS2dybDJHekgzblNFIn0sImFsZyI6IlNVLUVTMjU2In0.IkRvZSI~IkpheSI~ImpheWRvZUBleGFtcGxlLm9yZyI~NDI.juUVjoQpRPWr00_GNRqZHAbzhRqXquyBhPTAAnXa11aehhps1VnD7tdrrHJ7jzH_nmkd3j_KOpEKdq2AdDeKpk9PZQ9IAdFh4Nmmb1gubOgndWr_GkpRFSh_8dqhzDYaE6XJWy72uK-fHhvsZdWKP78lGpPsPldYlYFaPL6GEy_lk0-VHDz4JY2pH2wiZYjUjPZl75LlhIOuPt7MQAdB_Zmkhj8klP4ciMT4NNO6jZ8OMcOxZ8xBcarYtdHJxVlcjRzxs8-uVsnhv_sSggvbKpjpU67Wm3yMp2VQa2yrCWcdTAo89RUacGKfpYyFUhbO5pQvOZds8GC-hBv7fXs4rg7_zjrvKvKbDWK9ChzDoYdRIaz2bbWxsl5H0GmyCpQPS89vDK_cybmdSDDQnEq7H3h2pVGHP25OeFPNIGgWyno
```

An example of this JPT with selective disclosure of only the name and email claims (age hidden) being presented:
```
eyJpc3MiOiJodHRwczovL2lzc3Vlci50bGQiLCJjbGFpbXMiOlsiZmFtaWx5X25hbWUiLCJnaXZlbl9uYW1lIiwiZW1haWwiLCJhZ2UiXSwidHlwIjoiSlBUIiwicHJvb2ZfandrIjp7Imt0eSI6IkVDIiwieCI6ImFjYklRaXVNczNpOF91c3pFakoydHBUdFJNNEVVM3l6OTFQSDZDZEgyVjAiLCJ5IjoiX0tjeUxqOXZXTXB0bm1LdG00NkdxRHo4d2Y3NEk1TEtncmwyR3pIM25TRSIsImNydiI6IlAtMjU2In0sImFsZyI6IlNVLUVTMjU2In0.IkRvZSI~IkpheSI~ImpheWRvZUBleGFtcGxlLm9yZyI~.e_G50xSOj5xRWhVQkDARQ1giW_WLppeY7i7ptumeGsigLHZQkUSdT20miuYWMVAUq-FfS4R-MFbXnKSvmM41cu9fuYJlsYFwR5iNizHAbrjopzfFFujZ10VfVHihtHcxu312UMJPiQ9jQYaSPfu5QIAA360e23OT0ZDz1qFoDOGdELdgQ0qATWiR3KnNxNUNjQSJmhhIYJcYDAMd_MnfJYYFZGgmMMR3dd42UtQAuztG8SHPcwqBDNeDWKrEYGwNMAWDGNErUNiPfixvfhtDAn_DhxQQtVK7l9m-exBfK0dZ0d9CN55eoXLsgi_GuEyqhYKHqMPar9WCeOCzsn-Q03ri-zTqJm7glni-EV2LzYHeBDlbNmkraki2jkkih2tcM23n6gZgq5J97Qhq-pFddwVhUbkdoMpFYDxpi1jG490
```

## Example Multi-Use JWP

TBD

# Acknowledgements

TBD

# Registries

* Issuer Protected Header
* Presentation Protected Header
