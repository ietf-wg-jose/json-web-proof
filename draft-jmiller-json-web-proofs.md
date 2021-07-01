%%%
title = "JSON Web Proofs"
abbrev = "jwp"
docName = "draft-jmiller-json-web-proofs-latest"
category = "info"
ipr = "none"
workgroup="todo"
keyword = ["jose", "zkp", "jws"]

[seriesInfo]
name = "Internet-Draft"
value = "draft-jmiller-json-web-proofs"
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

This is an example of using markdown in the creation of an Internet Draft. The
specific flavor of markdown being used is mmark version 2, created by
Miek Gieben and available at [https://github.com/mmarkdown/mmark/](https://github.com/mmarkdown/mmark/).

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

This is some background text

# Use Cases {#usecases}

This section will include some use cases for our new protocol. The use
cases conform to the guidelines found in [@!RFC7268]. (Demonstrating a
normative reference inline.)

Note that the section heading also includes an anchor name that can be
referenced in a cross reference later in the document, as is done in
(#security-considerations) of this document. (Demonstrating using a
reference to a heading without writing an actual anchor, but rather using
the heading name in lowercase and with dashes.)

## First use case

Some text about the first use case. (And an example of using a second level
heading.)

## Second use case

This example includes a list:

- first item
- second item
- third item

And text below the list.

## Third use case

This use case includes some ascii art.  The format for this art is as follows:

~~~ ascii-art
        0
       +-+
       |A|
       +-+
~~~

# Security Considerations

As outlined earlier in (#usecases), there could be security issues in
various use cases.

# IANA Considerations

This document has no IANA actions.

{backmatter}
