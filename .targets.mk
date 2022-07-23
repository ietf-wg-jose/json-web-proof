TARGETS_DRAFTS := draft-jmiller-jose-json-proof-algorithms draft-jmiller-jose-json-proof-token draft-jmiller-jose-json-web-proof 
TARGETS_TAGS := 
draft-jmiller-jose-json-proof-algorithms-00.md: draft-jmiller-jose-json-proof-algorithms.md
	sed -e 's/draft-jmiller-jose-json-proof-algorithms-latest/draft-jmiller-jose-json-proof-algorithms-00/g' -e 's/draft-jmiller-jose-json-proof-token-latest/draft-jmiller-jose-json-proof-token-00/g' -e 's/draft-jmiller-jose-json-web-proof-latest/draft-jmiller-jose-json-web-proof-00/g' $< >$@
draft-jmiller-jose-json-proof-token-00.md: draft-jmiller-jose-json-proof-token.md
	sed -e 's/draft-jmiller-jose-json-proof-algorithms-latest/draft-jmiller-jose-json-proof-algorithms-00/g' -e 's/draft-jmiller-jose-json-proof-token-latest/draft-jmiller-jose-json-proof-token-00/g' -e 's/draft-jmiller-jose-json-web-proof-latest/draft-jmiller-jose-json-web-proof-00/g' $< >$@
draft-jmiller-jose-json-web-proof-00.md: draft-jmiller-jose-json-web-proof.md
	sed -e 's/draft-jmiller-jose-json-proof-algorithms-latest/draft-jmiller-jose-json-proof-algorithms-00/g' -e 's/draft-jmiller-jose-json-proof-token-latest/draft-jmiller-jose-json-proof-token-00/g' -e 's/draft-jmiller-jose-json-web-proof-latest/draft-jmiller-jose-json-web-proof-00/g' $< >$@
