%%%
title = "JSON Proof Token"
abbrev = "json-proof-token"
ipr = "trust200902"
workgroup="jose"
keyword = ["jose", "zkp", "jwp", "jws", "jpt"]
docname = "draft-ietf-jose-json-proof-token-latest"

[seriesInfo]
name = "Internet-Draft"
value = "draft-ietf-jose-json-proof-token-latest"
stream = "IETF"
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
initials = "M."
surname = "Jones"
fullname = "Michael B. Jones"
organization = "individual"
  [author.address]
  email = "michael_b_jones@hotmail.com"
  uri = "https://self-issued.info/"

[[author]]
initials = "D."
surname = "Waite"
fullname = "David Waite"
organization = "Ping Identity"
  [author.address]
  email = "dwaite+jwp@pingidentity.com"

%%%

.# Abstract

JSON Proof Token (JPT) is a compact, URL-safe, privacy-preserving representation of claims to be transferred between three parties.  The claims in a JPT are encoded as base64url-encoded JSON objects that are used as the payloads of a [JSON Web Proof (JWP)](https://www.ietf.org/archive/id/draft-ietf-jose-json-web-proof-00.html) structure, enabling them to be digitally signed and selectively disclosed.  JPTs also support reusability and unlinkability when using Zero-Knowledge Proofs (ZKPs).

{mainmatter}

# Introduction

JSON Proof Token (JPT) is a compact claims representation format intended to be used in the same ways as a JSON Web Token (JWT), but with additional support for selective disclosure and unlinkability.  JPTs encode claim values to be transmitted as payloads of a [JSON Web Proof (JWP)](https://www.ietf.org/archive/id/draft-ietf-jose-json-web-proof-00.html).  JPTs are always represented using the JWP Compact Serialization.  The corresponding claim names are not transmitted in the payloads and are stored in a separate structure that can be externalized and shared across multiple JPTs.

> Editor's Note: This draft is still early and incomplete, there will be significant changes to the algorithms as currently defined here.  Please do not use any of these definitions or examples for anything except personal experimentation and learning.  Contributions and feedback are welcome at https://github.com/json-web-proofs/json-web-proofs.

# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED",
"MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [@RFC2119] [@RFC8174] when, and only when, they appear in all capitals, as shown here.

# Background

JWP defines a container binding together a protected header, one or more payloads, and a cryptographic proof.  It does not define how claims are organized into payloads and what formats they are in.  JPTs are intended to be as close to a JWT as possible, while also supporting the selective disclosure and unlinkability of JWPs.

# Design Considerations

The rationale behind the design for JSON Proof Tokens is important when considering how it is structured.  These sections detail the underlying reasoning for the approach defined by JPTs.

## Unlinkability

Supporting unlinkability is perhaps the most challenging design constraint for JPTs.  Even the smallest oversight can introduce a subtle vector for relying parties to collude and correlate one or more subjects across their usage.

The principal tools to prevent this are data minimization and uniformity.  The data included in a JPT SHOULD be minimized to remove potential correlation points. The data SHOULD contain only values that are able to be selectively disclosed with consent or transformed by the proof algorithm when presented.

Any other data that is repeated across multiple JPTs is externalized so that it is uniform across every issuance.  This includes preventing the usage of optional headers, dynamic mapping of claims to payloads, changes to how many payloads are included, and the ordering of the payloads.

## Selective Disclosure

While JWPs provide the underling structure for easily supporting selective disclosure, JPTs must go a step further to ensure that applications can effectively provide choice and consent on exactly what is being disclosed.  Software using JWPs must know the mappings from payloads to claims.  JPTs do not support disclosing claims that are intended to be private from the issuer to the relying party.  All disclosed payloads MUST be mapped to claims and made accessible to the application.

## Familiarity

JPTs are intended to be as close to a JWT as possible in order to provide the simplest transition for any JWT-based system to add support for a JPT.

Although there are some stark differences in the lifecycle of a JPT, from the application's perspective, the interface to a JPT can be made fairly similar: a JSON object containing a mix of required and optional claims with well-understood values.

The most significant divergence required by JPTs is that of supporting values that may be disclosed or may instead only be a proof about the value.  Applications are required to interact with the JPT on a payload-by-payload basis instead of just verifying a JWT and then being able to interact with the JSON body directly.

## Proofs

In order to generate a variety of efficient ZKPs of knowledge, range, membership, or other predicates, it is essential that each individual payload is only a single claim value.  This greatly simplifies the task of linking a derived proof of a given claim to the specific payload that was also signed by the issuer.  While JPTs support claims that have complex object or array compound values, they also allow for simple claim values such as JSON strings, numbers, and booleans that can be used directly in generating predicate proofs.

# Claim Names

It is suggested that the claim names used with JPTs come from those in the IANA JSON Web Token Claims Registry, when those fit the application's needs.

# Claims

Using a JSON Proof Token requires combining information from two sources: the claim names and the payloads.  The simplest solution is to list the claim names in an ordered array that aligns with the included payloads.  This claims array can be conveniently included in the JWP Protected Header using the `claims` key.

When the claims array is stored in the header, any variations of it are disclosed to the verifier and can be used to correlate and link usages.  Given the privacy design considerations around linkability it is recommended that the claims are defined external to an individual JPT and either referenced or known by the application context.

In order to facilitate this external definition of the claim names, an additional `cid` key is defined with a required digest value calculated as defined here.  This `cid` can be used similar to a `kid` in order to ensure externally resolve and then verify that the correct list of claim names is being used when processing the payloads containing the claim values.

If there is an associated JWK containing the signing key information, the `claims` key is also registered there as a convenient location for the claim names.

All payloads are claim values and MUST be the base64url encoding of the UTF-8 representation of a JSON value.

The following is an example JWP Protected Header that includes a claims array:
```json
{
  "kid": "HjfcpyjuZQ-O8Ye2hQnNbT9RbbnrobptdnExR0DUjU8",
  "alg": "BBS",
  "claims": [
    "iat",
    "exp",
    "family_name",
    "given_name",
    "email"
  ]
}
```

# Payloads

> Editor's Note: This section is significantly incomplete, use it only as an indicator of the intended direction.

Application resolves each claim as required when processing the JPT.  Resolution can result in one of three things:
1. A disclosed JSON value
2. A custom proof method
3. A `null` value

## Disclosed

Always an octet string of valid JSON text.

## Proof Methods

* proof methods can be returned instead of a disclosed payload
* these are generated by the algorithm from information in the JWP's proof value
* a proof method may be custom based on the capabilities of the algorithm
* define common proof method types available?
  * range
  * membership
  * time
  * knowledge
  * linking

# Example JPT

See the JSON Web Proof draft appendix.

# Security Considerations

* Protected Header Minimization

# IANA Considerations

This document has no IANA actions.

{backmatter}

# Acknowledgements

TBD

# Document History

   [[ To be removed from the final specification ]]

  -00

  * Created initial working group draft based on draft-jmiller-jose-json-proof-token-01
