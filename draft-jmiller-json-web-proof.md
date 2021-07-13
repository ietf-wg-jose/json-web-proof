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

%%%

.# Abstract

The JOSE set of standards established JSON-based container formats for [Keys](https://datatracker.ietf.org/doc/rfc7517/), [Signatures](https://datatracker.ietf.org/doc/rfc7515/), [Encryption](https://datatracker.ietf.org/doc/rfc7516/), and [more](https://datatracker.ietf.org/wg/jose/documents/).  Since those were created, newer cryptographic algorithms that support selective disclosure and unlinkability have matured and started seeing early market adoption.

This document adds to the JOSE family by standardizing a new container format very similar in purpose and design to a JWS, called a _JSON Web Proof (JWP)_.  It adds support for the new algorithms by way of containing multiple individual payloads instead of a singular one as well as an additional derivation step to apply the privacy preserving selection and computation.

{mainmatter}

# Introduction

The JOSE specifications are very widely deployed and well supported technology combining security with the accessibility of JSON.  JWTs are one of the most common encapsulation formats for identity and access claims as part of the OpenID Connect standards.  More recently JOSE and JWTs are being integrated as part of the W3C's Verifiable Credentials work to implement Decentralized Identity use-cases.

With these new use-cases there is an increased focus on adopting privacy-protecting cryptographic primitives.  While such primitives are still an active area of academic and applied research, the leading candidates introduce new patterns that are not easily supported by JOSE.  These new patterns are largely focused on two areas: supporting selective disclosure when presenting a credential, and minimizing correlation through the use of Zero-Knowledge Proofs (ZKPs) instead of traditional signatures.

There are a growing number of these cryptographic primitives that support selective disclosure while protecting privacy across multiple presentations.  Examples that have already been or are being deployed in the context of Verifiable Credentials are:

* [CL Signatures](https://eprint.iacr.org/2012/562.pdf)
* [IDEMIX](http://www.zurich.ibm.com/idemix)
* [BBS+](https://github.com/mattrglobal/bbs-signatures)
* [Mercural Signatures](https://eprint.iacr.org/2020/979)
* [PS Signatures](https://eprint.iacr.org/2015/525.pdf)
* [U-Prove](https://www.microsoft.com/en-us/research/project/u-prove/)

All of these follow the same pattern of taking multiple claims (a.k.a. 'attributes' or 'messages' in the literature) and binding them together into an issued credential.  These are then later securely one-way transformed into a presentation, revealing potentially only a subset of the original claims as required.


# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174]
when, and only when, they appear in all capitals, as shown here.

The reader may wish to note that one of the two RFC references in the
preceding paragraph was normative; the other was informative. These will
be correctly identified as such in the References section below.

# Background

A _JSON Web Proof (JWP)_ is very similar to a JWS, with the addition that it can contain multiple individual payloads instead of a singular one.  New JWP-supporting algorithms are then able to separate and act on the individual payloads contained within.

In addition to the JWS `sign` and `verify` interactions, JWP also importantly adds a `derive` processing step for interaction with the algorithm to perform the selective disclosure and privacy preserving transformations.  This allows for multi-party interactions where a credential is issued from one party, derived by an intermediary party, then presented to another verifying party.  While `sign` only occurs once on a JWP, `derive` and `verify` may be repeated if supported by the algorithm.

The intent of JSON Web Proofs is to establish a common container format for multiple payloads that can be integrity-verified against a proof value.  It does not create or specify any cryptographic protocols,  interaction protocols, or required algorithm input values such as nonces.

# JWP Format

A JWP contains multiple specific payloads, which are always represented within an ordered array. These payloads have the same processing rules applied as they would within JWS.

The individual payloads are often meant to be composed into a single credential, and as such are most commonly not wholly indpendent from one another, but rather serve as facets of a whole. In keeping with the nomenclature of JWTs, such payloads are said to represent one or more _claims_.

An individual payload may contain structured information, such as a JSON document representing multiple claims. Another payload might represent a single JWT claim, such as a binary profile image. Other payloads may represent cryptographic values for supporting various proofs, which might also be interpreted as a claim.

## Payload Headers

With multiple payloads there must also be multiple protected headers in order to safely identify what each payload is and contains.  These headers can themselves easily become a correlation factor if the signer is putting unique values in them or generating unique arragements of headers and their payloads.  In order to minimize these possibilities, JWP places payload headers in the JWK definition so that they are common across all uses of that JWK.

Privacy preserving algorithms have a common pattern of supporting a fixed number of "slots" (also called "messages" or "attributes").  Often they are fixed at the time the public key is created and sometimes they are also pre-defined for a use-case specific number of attributes.  This is done in order to minimize any correlatable signals, to prevent a verifier from categorizing based on if the slots are of variable lengths even when only a subset are revealed in the proof.

The key used for a JWP that is identified either by its header or by context MUST have an associated ordered array of payload headers.  If defined by a JWK, this specification registers a `payloads` parameter with an array value, containing one object for each payload with its associated header values.

If the JWK includes a `use` parameter this specification registers a `proof` value that MUST be used in order for the JWK to be valid for a JWP.

For example:

```json
{
   "kty":"EC",
   "crv":"BLS12381_G1",
   "use":"proof",
   "x":"tCgCNuUYQotPEsrljWi-lIRIPpzhqsnJV1NPnE7je6glUb-FJm9IYkuv2hbHw22i",
   "payloads":[
      {"claims":["family_name", "given_name"]},
      {"claims":["email"]},
      {"claims":["birthdate"]},
      {"claims":["age"], "cty":"hashchain-commitment"},
      {"claims":["profile_pic"], "cty":"image/png"}
   ]
  }
```

## Protected Header

The JWP header MUST have an `alg` that supports proofs with signing, deriving, and verifying processing steps.

For example:
```json
{
    "alg":"BBS-BLS12"
}
```

## Payloads

Payloads are always represented as an ordered array.  Each payload's content type is either known by context or specified in that payload's associated header.

Example payloads:
```json
{
    "given_name":"Jane",
    "family_name":"Doe"
}
```
```json
{
    "email":"janedoe@example.com"
}
```
```json
{
    "birthdate":"0000-03-22"
}
```


## Proof

The proof value is a binary octet string that is opaque to applications.  Individual proof-supporting algorithms are responsible for the contents and security of the proof value along with any required internal structures to it.

All proofs MUST include integrity protection of the JWP's base64url encoded header value.  This value cannot be hidden and the protection MUST be included in the proof even after derivation.

# Derivation

When selective disclosure preferences are applied to a derivation any one or more payloads may be hidden.  The position of other payloads does not change due to any proceeding ones being hidden, the resulting array will simply be sparse missing the hidden values.

Algorithms SHOULD generate a new un-correlatable proof value when a JWP is derived.  A JWP may also be single-use where correlation across multiple derivations is not a factor.

# Serialization

Each payload MUST be base64url encoded when preparing it to be serialized.  The header and proof are also individually base64url encoded.

## Compact

The individually encoded payloads are concatenated with the `~` character to form an ordered delimited array. Any hidden payloads during a derivation are simply left blank, resulting in sequential `~~` characters such that all payload positions are preserved.

The header, payloads, and proof are then concatenated with a `.` character to form the final compact serialization.

Example compact serialization:

`eyJhbGciOiJCQlMtQkxTMTIifQ.eyJnaXZlbl9uYW1lIjoiSmFuZSIsImZhbWlseV9uYW1lIjoiRG9lIn0~eyJlbWFpbCI6ImphbmVkb2VAZXhhbXBsZS5jb20ifQ~eyJiaXJ0aGRhdGUiOiIwMDAwLTAzLTIyIn0.F9uMuJzNBqj4j-HPTvWjUN_MNoe6KRH0818WkvDn2Sf7kg1P17YpNyzSB-CH57AWDFunU13tL8oTBDpBhODckelTxHIaEfG0rNmqmjK6DOs0_ObksTZh7W3OTbqfD2h4C_wqqMQHSWdXXnojwyFDEg`

## JSON

Hidden payloads in the JSON serialization are represented with a `null` value.

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

# Security Considerations

* Requirements for supporting algorithms
* Application interface for verification

# IANA Considerations

This document has no IANA actions.

{backmatter}
