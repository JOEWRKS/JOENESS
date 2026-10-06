# Numeric representation

Source: local observation in [notes/work.md](../notes/work.md), checked
2026-10-03. This topic transfers the research previously in notes/research.md.
Observation: large-integer precision loss was reported.
Suggestion: BigInt as a replacement is only a research possibility.
Applicable scope: Numeric Pocket numeric representation and possible JSON export
compatibility; this note grants no product or implementation approval.
Remaining uncertainty: product adoption and any alternative JSON representation
are unverified. Direct native JSON serialization was checked below.
No new external research or reproduction was performed during setup.
Live defect/workaround: [I1](../ISSUES.md#i1--large-integer-precision-loss).

## 2026-10-06 — Local BigInt JSON probe

Source: local Node command executed for the user's approved research request.
Checked date: 2026-10-06. Environment reported by the process: Node v26.3.0,
V8 14.6.202.34-node.20, win32 x64. No application module was imported or changed.
Working directory: this project's Git root. PowerShell command:

```powershell
node -e 'console.log(JSON.stringify({node:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch})); for (const [label,value] of [["scalar",1n],["array",[1n]],["object",{value:1n}]]) { try { console.log(label+": "+JSON.stringify(value)); } catch (error) { console.log(label+": "+error.name+": "+error.message); } } const value=9007199254740993n; console.log("BigInt source: "+value.toString()); console.log("Number conversion JSON: "+JSON.stringify(Number(value))); console.log("Empty array control: "+JSON.stringify([]));'
```

Observed output (process exit 0; the expected serialization errors were caught):

```text
{"node":"v26.3.0","v8":"14.6.202.34-node.20","platform":"win32","arch":"x64"}
scalar: TypeError: Do not know how to serialize a BigInt
array: TypeError: Do not know how to serialize a BigInt
object: TypeError: Do not know how to serialize a BigInt
BigInt source: 9007199254740993
Number conversion JSON: 9007199254740992
Empty array control: []
```

Observation: in this process, native JSON.stringify rejected a direct BigInt
value and BigInt values inside arrays/objects. Converting the tested large value
to Number produced a different numeric value; the empty-array control serialized.
Inference within this scope: direct native JSON serialization cannot save these
BigInt examples as JSON. Number conversion is not a lossless solution for the
tested value. Some separately designed encoding would be needed to preserve it;
none is selected by this investigation.
Limits: one local Node/V8 environment and these inputs only. No file write/read
round trip, parser compatibility, replacer, toJSON override, string encoding,
other runtime, application integration or full numeric-boundary test was run.
This is research evidence, not a product decision, datatype adoption, issue fix,
or completion evidence for JSON delivery requirements.
