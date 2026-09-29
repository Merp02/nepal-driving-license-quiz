"""Build a glyph-id -> logical Unicode map for an embedded Devanagari TrueType font.

Word writes a lossy ToUnicode CMap for shaped Devanagari, so instead we derive
each glyph's text from the font itself: cmap gives base characters and the GSUB
ligature/single substitutions tell us what every conjunct / half form / reph /
presentation form is made of.
"""
from fontTools.ttLib import TTFont


def _unwrap(lookup):
    for st in lookup.SubTable:
        if lookup.LookupType == 7:
            yield st.ExtensionLookupType, st.ExtSubTable
        else:
            yield lookup.LookupType, st


def build_gid_map(path):
    font = TTFont(path)
    order = font.getGlyphOrder()
    name_to_gid = {n: i for i, n in enumerate(order)}
    text = {}  # glyph name -> str
    # prefer the lowest code point when a glyph has several (e.g. space/nbsp)
    cmap = font.getBestCmap()
    for cp, gname in sorted(cmap.items(), reverse=True):
        text[gname] = chr(cp)
    # Subsetting drops cmap entries for characters that only occur inside
    # conjuncts (e.g. ञ in ञ्च / ज्ञ).  The glyph ids are the original font's,
    # laid out in code point order, so fill gaps where both neighbours agree.
    dev = sorted((name_to_gid[g], cp) for cp, g in cmap.items()
                 if 0x0900 <= cp <= 0x097F and g in name_to_gid)
    for (g1, c1), (g2, c2) in zip(dev, dev[1:]):
        if g2 - g1 == c2 - c1 and g2 - g1 > 1:
            for k in range(1, g2 - g1):
                gname = order[g1 + k]
                text.setdefault(gname, chr(c1 + k))
    gsub = font['GSUB'].table if 'GSUB' in font else None
    subs = []  # (kind, inputs, output)
    if gsub:
        # The old 'deva' shaping model feeds below/post-base forms as C+halant,
        # the new 'dev2' model as halant+C (the logical order).  Process lookups
        # reachable from dev2 first so e.g. rakar maps to '्र', not 'र्'.
        dev2_lookups = []
        for sr in gsub.ScriptList.ScriptRecord:
            if sr.ScriptTag != 'dev2':
                continue
            langsys = [sr.Script.DefaultLangSys] + [l.LangSys for l in sr.Script.LangSysRecord]
            for ls in langsys:
                if ls is None:
                    continue
                for fi in ls.FeatureIndex:
                    dev2_lookups.extend(gsub.FeatureList.FeatureRecord[fi].Feature.LookupListIndex)
        seen = set()
        order_idx = [i for i in dev2_lookups if not (i in seen or seen.add(i))]
        order_idx += [i for i in range(len(gsub.LookupList.Lookup)) if i not in seen]
        feats = {}
        for fr in gsub.FeatureList.FeatureRecord:
            for li in fr.Feature.LookupListIndex:
                feats.setdefault(li, set()).add(fr.FeatureTag)
        halant = cmap.get(0x094D)
        for li in order_idx:
            lookup = gsub.LookupList.Lookup[li]
            is_dev2 = li in dev2_lookups
            below = bool(feats.get(li, set()) & {'blwf', 'pstf'})
            for kind, st in _unwrap(lookup):
                if kind == 1:
                    for src, dst in st.mapping.items():
                        subs.append((is_dev2, (src,), dst))
                elif kind == 3:
                    for src, alts in st.alternates.items():
                        for dst in alts:
                            subs.append((is_dev2, (src,), dst))
                elif kind == 4:
                    for first, ligs in st.ligatures.items():
                        for lig in ligs:
                            comps = (first, *lig.Component)
                            # old 'deva' model: below/post-base forms are fed as C+halant;
                            # their logical text is halant+C (e.g. rakar = '्र').
                            if not is_dev2 and below and len(comps) == 2 and comps[1] == halant:
                                comps = (comps[1], comps[0])
                            subs.append((is_dev2, comps, lig.LigGlyph))

    def closure(rules):
        changed = True
        while changed:
            changed = False
            for _, ins, out in rules:
                if out in text:
                    continue
                if all(g in text for g in ins):
                    text[out] = ''.join(text[g] for g in ins)
                    changed = True

    closure([s for s in subs if s[0]])   # dev2 (logical order) first
    closure(subs)                         # then anything only 'deva' reaches
    gdef = font['GDEF'].table.GlyphClassDef.classDefs if 'GDEF' in font and font['GDEF'].table.GlyphClassDef else {}
    hmtx = font['hmtx'].metrics
    info = {}
    for gname, gid in name_to_gid.items():
        info[gid] = {
            'name': gname,
            'text': text.get(gname),
            'cls': gdef.get(gname, 0),
            'adv': hmtx[gname][0] if gname in hmtx else None,
        }
    return info


if __name__ == '__main__':
    import sys
    info = build_gid_map(sys.argv[1])
    known = sum(1 for v in info.values() if v['text'])
    print(len(info), 'glyphs', known, 'with text')
    for gid in sorted(info):
        v = info[gid]
        if v['text'] and any(0x900 <= ord(c) <= 0x97F for c in v['text']):
            print(gid, repr(v['text']), v['cls'], v['adv'])
