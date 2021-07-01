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

More information can be found in [@!I-D.nottingham-for-the-users]. (An
example of an informative reference in the middle of text. Note that
referencing an Internet Draft involves replacing "draft-" in the name with
"I-D.".)

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
