%%%
title = "JSON Proof Token and CBOR Proof Token"
abbrev = "json-proof-token"
ipr = "trust200902"
workgroup="jose"
keyword = ["json", "jose", "zkp", "jwp", "jws", "jpt", "cbor", "cose", "cpt"]
docname = "draft-ietf-jose-json-proof-token"
consensus = true
tocdepth = 4

[seriesInfo]
name = "Internet-Draft"
value = "draft-ietf-jose-json-proof-token-latest"
stream = "IETF"
status = "standard"

[pi]
toc = "yes"

[[author]]
initials = "M."
surname = "Jones"
fullname = "Michael B. Jones"
organization = "Self-Issued Consulting"
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

[[author]]
initials = "J."
surname = "Miller"
fullname = "Jeremie Miller"
organization = "Ping Identity"
  [author.address]
   email = "jmiller@pingidentity.com"

%%%

.# Abstract

JSON Proof Token (JPT) is a compact, URL-safe, privacy-preserving
representation of claims to be transferred between three parties.  The
claims in a JPT are encoded as base64url-encoded JSON objects that are
used as the payloads of a JSON Web Proof (JWP) structure, enabling them
to be digitally signed and selectively disclosed.  JPTs also support
reusability and unlinkability when using Zero-Knowledge Proofs (ZKPs).

A CBOR-based representation of JPTs is also defined, called a CBOR Proof
Token (CPT).  It has the same properties as JPTs, but uses the JSON Web
Proof (JWP) CBOR Serialization, rather than the JSON-based JWP Compact
Serialization.

{mainmatter}

# Introduction

JSON Proof Token (JPT) is a compact claims representation format
intended to be used in the same ways as a JSON Web Token (JWT)
[@!RFC7519], but with additional support for selective disclosure and
unlinkability.  JPTs encode claim values to be transmitted as payloads
of a JSON Web Proof (JWP) [@!I-D.ietf-jose-json-web-proof].  JPTs are
always represented using the JWP Compact Serialization.  The
corresponding claim names are not transmitted in the payloads and are
stored in a separate structure that can be externalized and shared
across multiple JPTs.

Likewise, CBOR Proof Token (CPT) is a similar compact claims
representation format intended to be used in the same ways as a CBOR Web
Token (CWT) [@!RFC8392], but with the same support for selective
disclosure and unlinkability.  CPTs are represented using the JWP CBOR
Serialization.  The corresponding claim names are not transmitted in the
payloads and are stored in a separate structure that can be externalized
and shared across multiple CPTs.

# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in BCP 14
[@!RFC2119] [@!RFC8174] when, and only when, they appear in all
capitals, as shown here.

# Background

JWP defines a container binding together an integrity-protected Header,
one or more payload slots, and a cryptographic proof.  It does not
define how claims are organized into payloads and what formats they are
in.  JPTs are intended to be as close to a JWT as possible, while also
supporting the selective disclosure and unlinkability of JWPs.
Likewise, CPTs are intended to be as close to a CWT as possible, while
also supporting the selective disclosure and unlinkability of JWPs.

# Design Considerations

The rationale behind the design for JSON Proof Tokens and CBOR Proof
Tokens is important when considering how they are structured.  These
sections detail the underlying reasoning informing their design.

## Unlinkability

Supporting unlinkability is perhaps the most challenging design
constraint for JPTs and CPTs.  Even the smallest oversight can introduce
a subtle vector for relying parties to collude and correlate one or more
subjects across their usage.

The principal tools to prevent this are data minimization and
uniformity.  The data included SHOULD be minimized to remove potential
correlation points.  The data SHOULD contain only values that are able
to be selectively disclosed with consent or transformed by the proof
algorithm when presented.

Any other data that is repeated across multiple JPTs or CPTs is
externalized so that it is uniform across every issuance.  This includes
preventing the usage of optional Headers, dynamic mapping of claims to
payloads, changes to how many payloads are included, and the ordering of
the payloads.

## Selective Disclosure

While JWPs provide the underling structure for easily supporting
selective disclosure, JPTs and CPTs must go a step further to ensure
that holders can effectively provide choice and consent on exactly what
is being disclosed.  Software using JWPs or CPTs MUST know the mappings
from payloads to claims.  All disclosed payloads MUST be mapped to
claims and made accessible to the application.  Holders SHOULD
understand the semantics of all potentially disclosed claims to the
extent needed to decide whether to disclose them.  JPTs and CPTs SHOULD
NOT contain claims that are intended only for a specific verifier.

## Familiarity

JPTs are intended to be as close to a JWT as possible in order to
provide the simplest transition for any JWT-based system to add support
for JPTs.  The same is true for CPTs and CWTs.

Although there are some stark differences in the lifecycle of a JPT,
from the application's perspective, the interface to a JPT can be made
fairly similar: a JSON object containing a mix of required and optional
claims with well-understood values.  Likewise, A CPT is a CBOR object
containing a mix of required and optional claims with well-understood
values.

The most significant divergence required by JPTs and CPTs is that of
supporting values that may be disclosed or may instead only be a proof
about the value.  Applications are required to interact with the JPT or
CPT on a payload-by-payload basis instead of just verifying a JWT or CWT
and then being able to interact with the JSON or CBOR body directly.

## Proofs

To generate a variety of efficient ZKPs of knowledge, range, membership,
or other predicates, it is essential that each individual payload is
only a single claim value.  This greatly simplifies the task of linking
a derived proof of a given claim to the specific payload that was also
signed by the issuer.  While JPTs and CPTs support claims that have
complex object or array compound values, they also allow for simple
claim values such as strings, numbers, and booleans that can be used
directly in generating predicate proofs.

# Claim Names

It is RECOMMENDED that the claim names used with JPTs come from those in
the IANA JSON Web Token Claims Registry [@IANA.JWT] established by
[@!RFC7519], when those fit the application's needs.  Likewise, it is
RECOMMENDED that the claim names used with CPTs come from those in the
IANA CBOR Web Token Claims Registry [@IANA.CWT] established by
[@!RFC8392], when those fit the application's needs.

# Claims Header Parameter {#claimsDef}

The issuer of a JPT or CPT assigns each payload a named claim, or a
pointer to a subset of data within a named claim.  Payloads MUST each
have a negotiated and understood claim name within the application
context. The `claims` Header Parameter allows for the mapping of payload
slots to claims (and claim subsets) to be expressed within the Issuer
Header.

The `claims` Header Parameter is an array of ordered elements, where
each element is either a claim name, or selects some subset of a named
claim. Use of this Header Parameter is OPTIONAL.

An element value which is a string (or integer for CPT) indicates the
claim name of the payload slot. For JPT, the corresponding payload MUST
be the UTF-8 JSON Text containing the claim value, or a zero length
payload if there is no corresponding claim value. For CPT, the
corresponding payload MUST be the CBOR containing the claim value, or a
zero length payload if there is no corresponding claim value.

The claim mechanism is meant to disclose issuer-specified values.
Predicate proofs derived from payload values are not represented as
claims; they are instead contained in the presentation proof using
algorithm-specific representations.

## Claims Path Pointer

This syntax is purposely meant to align with [DCQL], [SD-JWT-VC], and
[CBOR-POINTER].

A Claims Path Pointer is used to disclose a subset of a claim. This
allows for claim to be declared as having structured information (such
as a mailing address or transcript), while still allowing for only a
subset of the information needed to be disclosed.

The pointer is evaluated against a context, which is either a JSON
value or CBOR data item representing all claims. The result of the
pointer is a JSON value or CBOR data item, or a failure if no such data
item is available. For the purpose of representation in a payload, a
failure is represented as a zero-length octet string.

A pointer is represented as an array, where each element in sequence
represents a pathspec for selecting a subset of a data item in context.
Unlike selectors in [CSS] and expression languages like [JSONPATH], the
syntax is purposefully restricted to aid in implementation, and to
prevent attacker-chosen pointers from causing unexpectedly high runtime
resource usage.

Each pathspec element is evaluated in sequence, and will select either
a new value/data item or fail. The resulting value/data item is then
evaluated against the next pathspec element until evaluation completes.
If evaluation of a pathspec fails, further evaluation is aborted.

Evaluation is dependent on the type of value or data item currently
in context.

1. For a CBOR Map or JSON Object the pathspec defines an exact match
against the key. For JSON, the pathspec MUST represented as a string.
For CBOR, the pathspec is any valid CBOR data item. On match, the result
is the value associated with the matched key.

2. For a CBOR or JSON array, the pathspec MUST be a non-negative integer
corresponding to the zero-based index of the array. On match, the result
is the value at the corresponding array index. Indexes outside the
bounds of the array are considered normal failures.

3. For a CBOR tag, a matching non-negative integer will return the
untagged data item.

There are no rules currently which evaluate against other CBOR data
items.

The following is an example JSON-formatted Issuer Header containing a
claims property:

<{{./fixtures/template/jpt-issuer-protected-header-with-claims.json}}

In this example, the "iat" and "exp" would be JSON-formatted numbers,
"family_name", "given_name" and "email" would be JSON strings (in
quotes), "addresses" would be a JSON array containing at least two JSON
objects,
and "age_equal_or_over" would be A JSON object containing at least a key
21 and corresponding value of either `true` or `false`.

# Claims ID ("cid") Header Parameter {#cidDef}

A Claims ID ("cid") value can be used as an identifier for a set of
claim names without explicitly listing them.  Its use is similar to the
Key ID ("kid") Header Parameter.

The structure of the `cid` value is unspecified.  For JPTs, its value
MUST be a case-sensitive string.  For CPTs, its value MUST be a binary
string.  Use of this Header Parameter is OPTIONAL.

The `cid` can be used similarly to a `kid` in order to ensure that it is
possible to externally resolve and then verify that the correct list of
claim names is being used when processing the payloads containing the
claim values.

If there is an associated JWK containing the signing key information,
the `claims` key is also registered there as a convenient location for
the claim names.  Likewise, if there is an associated COSE_Key
containing the signing key information, the `claims` key is also
registered there as a convenient location for the claim names.

When the claims array is transferred as a property in the Issuer Header,
any variations of that array between JWP will be visible to the
verifier, and can leak information about the subject or provide an
additional vector for linkability.  Given the privacy design
considerations around linkability, it is RECOMMENDED that the claims are
defined externally to an individual JPT or CPT and either referenced or
known by the application context.

The following is an example Header that includes a `cid`:

<{{./fixtures/template/jpt-issuer-protected-header-with-cid.json}}

# Presented Claims and Proofs

Each claim in the issued form of the JPT or CPT results in one of three
things in the presented form of the JPT or CPT:

1. A disclosed JSON or CBOR value.
2. An indicator that the value was not disclosed.
3. An algorithm-specific proof method.

## Disclosed

A disclosed payload of a JPT is represented as a UTF8-encoded octet
string representing a valid JSON value.  A disclosed payload of a CPT is
represented as a CBOR value.

## Undisclosed

The placeholder indicating that a payload was not disclosed is
represented as described in [@!I-D.ietf-jose-json-web-proof, Section 6]
(Serializations).

# Example JPT and CPT

See the examples in [@I-D.ietf-jose-json-proof-algorithms, section A.1].

# Security Considerations {#security}

- Header Minimization

# IANA Considerations

## JSON Web Proof Header Parameters Registration {#HdrReg}

This section registers the following Header Parameter in the IANA
"JSON Web Proof Header Parameters" registry established by
[@!I-D.ietf-jose-json-web-proof].

### Registry Contents {#HdrContents}

#### "claims" (Claims) Header Parameter

- Header Parameter Name: Claims
- Header Parameter JSON Label: `claims`
- Header Parameter CBOR Label: 10
- Header Parameter Usage Location(s): Issued
- Change Controller: IETF
- Specification Document(s): (#claimsDef) of this specification

#### "cid" (Claims ID) Header Parameter

- Header Parameter Name: Claims ID
- Header Parameter JSON Label: `cid`
- Header Parameter CBOR Label: 11
- Header Parameter Usage Location(s): Issued
- Change Controller: IETF
- Specification Document(s): (#cidDef) of this specification

## JSON Web Key Parameters Registry {#JWKParamReg}

This section registers the following JWK parameter in the IANA "JSON Web
Key Parameters" registry [@IANA.JOSE] established by [@RFC7517].

### Registry Contents {#JWKParamContents}

- Parameter Name: claims
- Parameter Description: Array of claim names
- Used with "kty" Value(s): *
- Parameter Information Class: Public
- Change Controller: IETF
- Specification Document(s): (#cidDef) of this specification

## COSE Key Common Parameters Registry {#COSEKeyParamReg}

This section registers the following COSE_Key parameter in the IANA
"COSE Key Common Parameters" registry [@IANA.COSE] established by
[@RFC8152].

### Registry Contents {#COSEKeyParamContents}

- Name: claims
- Label: TBD (requested assignment 6)
- CBOR Type: array
- Value Registry: CBOR Web Token Claims
- Description: Array of claim names
- Reference: (#cidDef) of this specification

## Media Types Registry

This section registers the following media type [@RFC2046] in the IANA
"Media Types" registry [@IANA.MediaTypes] in the manner
described in [@RFC6838].

### application/jpt {#jpt_media_type}

The media type for a JSON Proof Token (JPT) is `application/jpt`.

- Type name: application
- Subtype name: jpt
- Required parameters: n/a
- Optional parameters: n/a
- Encoding considerations: 8bit; JPT values are encoded as a series of
  base64url-encoded values (some of which may be the empty string)
  separated by period ('.') characters.
- Security considerations: See (#security) of this specification
- Interoperability considerations: n/a
- Published specification: This specification
- Applications that use this media type: Applications releasing claims
  with zero-knowledge proofs
- Additional information:
  - Magic number(s): n/a
  - File extension(s): n/a
  - Macintosh file type code(s): n/a
- Person & email address to contact for further information:
  Michael B. Jones, michael_b_jones@hotmail.com
- Intended usage: COMMON
- Restrictions on usage: none
- Author: Michael B. Jones, michael_b_jones@hotmail.com
- Change controller: IETF
- Provisional registration: No

### application/cpt {#cpt_media_type}

The media type for a CBOR Proof Token (CPT) is `application/cpt`.

- Type name: application
- Subtype name: cpt
- Required parameters: n/a
- Optional parameters: n/a
- Encoding considerations: 8bit; CPT values are encoded as CBOR
- Security considerations: See (#security) of this specification
- Interoperability considerations: n/a
- Published specification: This specification
- Applications that use this media type: Applications releasing claims
  with zero-knowledge proofs
- Additional information:
  - Magic number(s): n/a
  - File extension(s): n/a
  - Macintosh file type code(s): n/a
- Person & email address to contact for further information:
  Michael B. Jones, michael_b_jones@hotmail.com
- Intended usage: COMMON
- Restrictions on usage: none
- Author: Michael B. Jones, michael_b_jones@hotmail.com
- Change controller: IETF
- Provisional registration: No

## Structured Syntax Suffix Registry

This section registers the following entries in the IANA "Structured
Syntax Suffix" registry [IANA.StructuredSuffix] in the manner described
in [@RFC6838].

### +jpt

- Name: JSON Proof Token (JPT)
- +suffix: +jpt
- References: This specification
- Encoding considerations: 8bit; JPT values are encoded as a series of
  base64url-encoded values (some of which may be the empty string)
  separated by period ('.') characters.
- Interoperability considerations: n/a
- Fragment identifier considerations: n/a
- Security considerations: See (#security) of this specification
- Contact: Michael B. Jones, michael_b_jones@hotmail.com
- Author/Change controller: IETF

### +cpt

- Name: CBOR Proof Token (CPT)
- +suffix: +cpt
- References: This specification
- Encoding considerations: 8bit; CPT values are encoded as CBOR
- Interoperability considerations: n/a
- Fragment identifier considerations: n/a
- Security considerations: See (#security) of this specification
- Contact: Michael B. Jones, michael_b_jones@hotmail.com
- Author/Change controller: IETF

## CoAP Content-Formats Registry

This section registers the following CoAP Content-Formats value in the
[@IANA.CoAP.Formats] registry.

### "CPT" CoAP Content-Format

The CoAP Content-Format for a CBOR Proof Token (CPT) is as follows.

- Content Type: application/cpt
- ID: TBD (requested assignment 20)
- Reference: (#cpt_media_type) of this specification

{backmatter}

{{common-biblio.md}}
{{series-draft-biblio.md}}

# Acknowledgements

This work was incubated in the DIF [Applied Cryptography Working
Group](https://identity.foundation/working-groups/crypto.html).

We would like to thank
Brent Zundel
for his valuable contributions to this specification.

# Document History

[[ To be removed from the final specification ]]

 -11

- Change Issuer Protected Header to Protected Header
- Remove JWP qualifiers on Header and Protected Header

 -10

- Registered `+jpt` and `+cpt` structured syntax suffixes.
- Clarify mapping of the `claims` array to payload data using "payload
  slot" nomenclature
- Move proof methods text to JWP.

 -09

- No changes

 -08

- Defined CBOR Proof Token (CPT).
- Registered application/jpt and application/cpt media types and CPT
  CoAP Content-Format.
- Made some additional references normative.

 -07

- Changing primary editor
- Move `claims` definition from JWP, to live beside `cid`
- Update `cid` registry entry to assign CBOR label

 -06

- Update reference to new repository home
- Fixed #99: Discussed issued and presented forms of JPTs.

 -05

- Define and register Claims ID JWP Header Parameter.

  -04

- Refactoring figures and examples to be built from a common set across
  all three documents

  -03

- Improvements resulting from a full proofreading.
- Added examples of JSON object and JSON boolean claims.

  -02

- Update example to use the current BBS algorithm

  -01

- Correct cross-references within group.

  -00

- Created initial working group draft based on
  draft-jmiller-jose-json-proof-token-01
