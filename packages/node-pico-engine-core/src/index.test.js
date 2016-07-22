var _ = require("lodash");
var λ = require("contra");
var test = require("tape");
var mkTestPicoEngine = require("./mkTestPicoEngine");

var omitMeta = function(resp){
  if(!_.has(resp, "directives")){
    return resp;
  }
  return _.map(resp.directives, function(d){
    return _.omit(d, "meta");
  });
};

var mkSignalTask = function(pe, eci){
  return function(domain, type, attrs){
    return λ.curry(pe.signalEvent, {
      eci: eci,
      eid: "1234",
      domain: domain,
      type: type,
      attrs: attrs || {}
    });
  };
};

var mkQueryTask = function(pe, eci, rid){
  return function(name, args){
    return λ.curry(pe.runQuery, {
      eci: eci,
      rid: rid,
      name: name,
      args: args || {}
    });
  };
};

var testOutputs = function(t, pairs, callback){
  λ.series(_.map(pairs, function(pair){
    if(!_.isArray(pair)){
      return pair;
    }
    return pair[0];
  }), function(err, results){
    if(err) return callback(err);
    _.each(pairs, function(pair, i){
      if(!_.isArray(pair)){
        return;
      }
      var actual = results[i];
      var expected = pair[1];

      t.deepEquals(omitMeta(actual), expected);
    });
    callback();
  });
};

test("PicoEngine - hello_world ruleset", function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    npico: λ.curry(pe.db.newPico, {}),
    chan0: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    rid1x: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.hello_world"}),

    hello_event: λ.curry(pe.signalEvent, {
      eci: "id1",
      eid: "1234",
      domain: "echo",
      type: "hello",
      attrs: {}
    }),
    hello_query: λ.curry(pe.runQuery, {
      eci: "id1",
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: {obj: "Bob"}
    })

  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(data.hello_event, {
      directives: [
        {
          name: "say",
          options: {
            something: "Hello World"
          },
          meta: {
            eid: "1234",
            rid: "io.picolabs.hello_world",
            rule_name: "say_hello",
            txn_id: "TODO"
          }
        }
      ]
    });
    t.deepEquals(data.hello_query, "Hello Bob");

    t.end();
  });
});

test("PicoEngine - persistent ruleset", function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    pico0: λ.curry(pe.db.newPico, {}),
    chan1: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    rid_0: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.persistent"}),

    pico2: λ.curry(pe.db.newPico, {}),
    chan3: λ.curry(pe.db.newChannel, {pico_id: "id2", name: "three", type: "t"}),
    rid_1: λ.curry(pe.db.addRuleset, {pico_id: "id2", rid: "io.picolabs.persistent"}),

    store_bob0: λ.curry(pe.signalEvent, {
      eci: "id1",
      eid: "1234",
      domain: "store",
      type: "name",
      attrs: {name: "bob"}
    }),

    query0: λ.curry(pe.runQuery, {
      eci: "id1",
      rid: "io.picolabs.persistent",
      name: "getName",
      args: {}
    }),

    store_bob1: λ.curry(pe.signalEvent, {
      eci: "id1",
      eid: "12345",
      domain: "store",
      type: "name",
      attrs: {name: "jim"}
    }),

    query1: λ.curry(pe.runQuery, {
      eci: "id1",
      rid: "io.picolabs.persistent",
      name: "getName",
      args: {}
    }),
    query2: λ.curry(pe.runQuery, {
      eci: "id1",
      rid: "io.picolabs.persistent",
      name: "getName",
      args: {}
    }),

    store_appvar0: λ.curry(pe.signalEvent, {
      eci: "id1",
      eid: "123456",
      domain: "store",
      type: "appvar",
      attrs: {appvar: "global thing"}
    }),
    query3: λ.curry(pe.runQuery, {
      eci: "id1",
      rid: "io.picolabs.persistent",
      name: "getAppVar",
      args: {}
    }),
    query4: λ.curry(pe.runQuery, {
      eci: "id3",
      rid: "io.picolabs.persistent",
      name: "getAppVar",
      args: {}
    })
  }, function(err, data){
    if(err) return t.end(err);

    t.deepEquals(omitMeta(data.store_bob0), [
        {name: "store_name", options: {name: "bob"}}
    ]);

    t.deepEquals(data.query0, "bob");

    t.deepEquals(omitMeta(data.store_bob1), [
      {name: "store_name", options: {name: "jim"}}
    ]);

    t.deepEquals(data.query1, "jim");
    t.deepEquals(data.query2, "jim");

    t.deepEquals(omitMeta(data.store_appvar0), [
      {name: "store_appvar", options: {appvar: "global thing"}}
    ]);
    t.deepEquals(data.query3, "global thing");
    t.deepEquals(data.query4, "global thing");

    t.end();
  });
});

/*
test("PicoEngine - raw ruleset", function(t){
  var pe = mkTestPicoEngine();

  λ.series({
    pico: λ.curry(pe.db.newPico, {}),
    chan: λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    rid3: λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "rid3x0"}),

    signal: λ.curry(pe.runQuery, {
      eci: "id1",
      rid: "rid3x0",
      name: "sayRawHello",
      args: {}
    })

  }, function(err, data){
    if(err) return t.end(err);

    t.ok(_.isFunction(data.signal));

    data.signal({
      end: function(txt){
        t.equals(txt, "raw hello!");
        t.end();
      }
    });
  });
});
*/

test("PicoEngine - io.picolabs.events ruleset", function(t){
  var pe = mkTestPicoEngine();

  var signal = mkSignalTask(pe, "id1");

  testOutputs(t, [
    λ.curry(pe.db.newPico, {}),
    λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.events"}),
    [
      signal("events", "bind", {name: "blah?!"}),
      [{name: "bound", options: {name: "blah?!"}}]
    ],
    [
      signal("events", "get", {thing: "asdf"}),
      [{name: "get", options: {thing: "asdf"}}]
    ],
    [
      signal("events", "noop", {}),
      []
    ],
    [
      signal("events_or", "a"),
      [{name: "or", options: {}}]
    ],
    [
      signal("events_or", "b"),
      [{name: "or", options: {}}]
    ],
    [
      signal("events_or", "c"),
      []
    ],
    [
      signal("events_and", "a"),
      []
    ],
    [
      signal("events_and", "c"),
      []
    ],
    [
      signal("events_and", "b"),
      [{name: "and", options: {}}]
    ],
    [
      signal("events_and", "b"),
      []
    ],
    [
      signal("events_and", "a"),
      [{name: "and", options: {}}]
    ],
    [
      signal("events_and", "b"),
      []
    ],
    [
      signal("events_and", "b"),
      []
    ],
    [
      signal("events_and", "b"),
      []
    ],
    [
      signal("events_and", "a"),
      [{name: "and", options: {}}]
    ]
  ], t.end);
});

test("PicoEngine - io.picolabs.scope ruleset", function(t){
  var pe = mkTestPicoEngine();

  var query = mkQueryTask(pe, "id1", "io.picolabs.scope");
  var signal = mkSignalTask(pe, "id1");

  testOutputs(t, [
    λ.curry(pe.db.newPico, {}),
    λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.scope"}),
    [
      signal("scope", "event0", {name: "name 0"}),
      [{name: "say", options: {name: "name 0"}}]
    ],
    [
      signal("scope", "event1", {name: "name 1"}),
      [{name: "say", options: {name: undefined}}]
    ],
    [
      signal("scope", "event0", {}),
      [{name: "say", options: {name: ""}}]
    ],
    [
      signal("scope", "prelude", {name: "Bill"}),
      [{name: "say", options: {
        name: "Bill",
        p0: "prelude 0",
        p1: "prelude 1",
        g0: "global 0"
      }}]
    ],
    [
      query("getVals"),
      {name: "Bill", p0: "prelude 0", p1: "prelude 1"}
    ],
    [
      query("g0"),
      "global 0"
    ],
    [
      query("add", {"a": 10, "b": 2}),
      12
    ],
    [
      signal("scope", "functions"),
      [{name: "say", options: {
        add_one_two: 3,
        inc5_3: 8,
        g0: "overrided g0!"
      }}]
    ]
  ], t.end);
});

test("PicoEngine - io.picolabs.operators ruleset", function(t){
  var pe = mkTestPicoEngine();

  var query = mkQueryTask(pe, "id1", "io.picolabs.operators");

  testOutputs(t, [
    λ.curry(pe.db.newPico, {}),
    λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.operators"}),
    [
      query("results"),
      {
        "str_as_num": 100.25,
        "num_as_str": "1.05",
        "regex_as_str": "blah",
        "isnull": [
          false,
          false,
          true
        ],
        "typeof": [
          "Number",
          "String",
          "String",
          "Array",
          "Map",
          "RegExp",
          "Null",
          "Null"
        ],
        "75.chr()": "K",
        "0.range(10)": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "10.sprintf": "< 10>",
        ".capitalize()": "Hello World",
        ".decode()": [3, 4, 5],
        ".extract": ["s is a st","ring"],
        ".lc()": "hello world",
        ".match true": true,
        ".match false": false,
        ".ord()": 72,
        ".replace": "Hello Billiam!",
        ".split": ["a", "b", "c"],
        ".sprintf": "Hello Jim!",
        ".substr(5)": "is a string",
        ".substr(5, 4)": "is a",
        ".substr(5, -5)": "is a s",
        ".substr(25)": undefined,
        ".uc()": "HELLO WORLD"
      }
    ]
  ], t.end);
});

test("PicoEngine - io.picolabs.chevron ruleset", function(t){
  var pe = mkTestPicoEngine();

  var query = mkQueryTask(pe, "id1", "io.picolabs.chevron");

  testOutputs(t, [
    λ.curry(pe.db.newPico, {}),
    λ.curry(pe.db.newChannel, {pico_id: "id0", name: "one", type: "t"}),
    λ.curry(pe.db.addRuleset, {pico_id: "id0", rid: "io.picolabs.chevron"}),
    [
      query("d"),
      "\n      hi 1 + 2 = 3\n      <h1>some<b>html</b></h1>\n    "
    ]
  ], t.end);
});