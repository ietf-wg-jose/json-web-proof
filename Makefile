SUBDIRS = fixtures
LIBDIR := lib
include $(LIBDIR)/main.mk

.PHONY: $(SUBDIRS)
fixtures:
	@cd fixtures; node --no-warnings bbs-keygen.mjs; node --no-warnings bbs-fixtures.mjs

$(drafts_xml): fixtures

$(LIBDIR)/main.mk:
ifneq (,$(shell grep "path *= *$(LIBDIR)" .gitmodules 2>/dev/null))
	git submodule sync
	git submodule update $(CLONE_ARGS) --init
else
	git clone -q --depth 10 $(CLONE_ARGS) \
	    -b main https://github.com/martinthomson/i-d-template $(LIBDIR)
endif

clean::
	rm -r fixtures/build
