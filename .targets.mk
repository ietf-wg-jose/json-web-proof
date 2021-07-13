TARGETS_DRAFTS := draft-jmiller-json-web-proof 
TARGETS_TAGS := 
draft-jmiller-json-web-proof-00.md: draft-jmiller-json-web-proof.md
	sed -e 's/draft-jmiller-json-web-proof-latest/draft-jmiller-json-web-proof-00/g' $< >$@
