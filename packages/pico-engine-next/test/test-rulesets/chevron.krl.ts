import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("chevron.krl", async t => {
  const { pe, eci } = await startTestEngine(["chevron.krl"]);

  var resp = await pe.pf.query({
    eci,
    rid: "io.picolabs.chevron",
    name: "d",
    args: {}
  });
  t.is(
    resp,
    "\n            hi 1 + 2 = 3\n            <h1>some<b>html</b></h1>\n        "
  );
});