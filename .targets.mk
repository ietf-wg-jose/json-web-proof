TARGETS_DRAFTS := draft-jmiller-json-proof-algorithms draft-jmiller-json-proof-token draft-jmiller-json-web-proof 
TARGETS_TAGS := 
draft-jmiller-json-proof-algorithms-00.md: draft-jmiller-json-proof-algorithms.md
	sed -e 's/draft-jmiller-json-proof-algorithms-latest/draft-jmiller-json-proof-algorithms-00/g' -e 's/draft-jmiller-json-proof-token-latest/draft-jmiller-json-proof-token-00/g' -e 's/draft-jmiller-json-web-proof-latest/draft-jmiller-json-web-proof-00/g' $< >$@
draft-jmiller-json-proof-token-00.md: draft-jmiller-json-proof-token.md
	sed -e 's/draft-jmiller-json-proof-algorithms-latest/draft-jmiller-json-proof-algorithms-00/g' -e 's/draft-jmiller-json-proof-token-latest/draft-jmiller-json-proof-token-00/g' -e 's/draft-jmiller-json-web-proof-latest/draft-jmiller-json-web-proof-00/g' $< >$@
draft-jmiller-json-web-proof-00.md: draft-jmiller-json-web-proof.md
	sed -e 's/draft-jmiller-json-proof-algorithms-latest/draft-jmiller-json-proof-algorithms-00/g' -e 's/draft-jmiller-json-proof-token-latest/draft-jmiller-json-proof-token-00/g' -e 's/draft-jmiller-json-web-proof-latest/draft-jmiller-json-web-proof-00/g' $< >$@
