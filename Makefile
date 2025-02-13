SUBDIRS = fixtures
LIBDIR := lib
include $(LIBDIR)/main.mk

$(LIBDIR)/main.mk:
ifneq (,$(shell grep "path *= *$(LIBDIR)" .gitmodules 2>/dev/null))
	git submodule sync
	git submodule update --init
else
ifneq (,$(wildcard $(ID_TEMPLATE_HOME)))
	ln -s "$(ID_TEMPLATE_HOME)" $(LIBDIR)
else
	git clone -q --depth 10 -b main \
	    https://github.com/martinthomson/i-d-template $(LIBDIR)
endif
endif

.PHONY: $(SUBDIRS)
fixtures:
	@cd fixtures; node --no-warnings nonce.mjs
	@cd fixtures; node --no-warnings bbs-keygen.mjs; node --no-warnings bbs-fixtures.mjs
	@cd fixtures; node --no-warnings es256-keygen.mjs issuer; \
		node --no-warnings es256-keygen.mjs holder; \
		node --no-warnings es256-keygen.mjs ephemeral; \
		node --no-warnings su-es256-fixtures.mjs
	@cd fixtures; node --no-warnings mac-h256-secret-gen.mjs; node --no-warnings mac-h256-fixtures.mjs 

$(drafts_xml): fixtures

clean::
	rm -r fixtures/build
