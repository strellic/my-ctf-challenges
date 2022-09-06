// quiz.js
const $ = document.querySelector.bind(document); // imagine using jQuery...

const triesLeft = Number(localStorage.tries || "2");
if (triesLeft <= 0) {
    $("#gameover").style.display = "block";
}
else {
    $("#remaining").innerText = triesLeft === 1 ? `1 try` : `${triesLeft} tries`;
    $("#start").style.display = "block";
}

let quiz = [];
let num = 0;

function start() {
    localStorage.tries = String(triesLeft - 1);

    while(quiz.length !== 15) {
        let index = Math.floor(Math.random() * questions.length);
        quiz.push(questions[index]);
        questions.splice(index, 1);
    }

    $("#quiz").innerHTML = generate();
    $("#start").style.display = "none";
    $("#q0").style.display = "block";
}

function next() {
    if (Array.from($("#q" + num).querySelectorAll("input")).filter(i => i.checked).length === 0) {
        // you didn't pick an option lmao
        return;
    }

    $("#q" + num).classList = "mt-4 question animate__animated animate__fadeOutLeft";
    $("#q" + num + " button").onclick = null;
    num += 1;
    setTimeout(() => {
        $("#q" + num).style.display = "block";
        $("#q" + num).classList = "mt-4 question animate__animated animate__fadeInRight";
    }, 500);
}

function finish() {
    $("#q" + num).classList = "mt-4 question animate__animated animate__fadeOutLeft";
    $("#q" + num + " button").onclick = null;

    const responses = Array.from(document.querySelectorAll(".question"))
        .map(q => [
            q.children[1].innerText,
            Array.from(q.children[2].querySelectorAll("input"))
                .filter(a => a.checked)[0]?.nextElementSibling?.innerText || "???"
        ]);
    console.log(responses);
    
    // TODO: implement scoring somehow
    // kinda lazy, ill figure this out some other time

    setTimeout(() => {
        let score = 0;
        fetch("/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "score=" + score
        })
        .then(r => r.json())
        .then(j => {
            if (j.pass) {
                $("#reward").innerText = j.flag;
                $("#pass").style.display = "block";
            }
            else {
                $("#fail").style.display = "block";
            }
        });
    }, 1250);
}

function generate() {
    let template = (q, num) => `
    <div class="mt-4 question" style="display: none" id="q${num}">
        <h4>Question ${num + 1}:</h4>
        <h5>${q.question}</h5>
        <div>
            ${q.answers.map((a, i) => `
            <div class="form-check">
                <input class="form-check-input" type="radio" id="q${num}-a${i}" name="q${num}">
                <label class="form-check-label" for="q${num}-a${i}">${a}</label>
            </div>
            `).join("\n")}
        </div>
        ${num !== 14 ? (
            `<button class="btn btn-primary mt-2" type="button" onclick="next()">Next →</button>`
        ) : (
            `<button class="btn btn-info mt-2" type="button" onclick="finish()">Finish →</button>`
        )}
    </div>`;

    return quiz.map(template).join("\n"); 
}

// these questions shamelessly yoinked from the LinkedIn Skill Assessment JSON Quiz
// we've actually failed this test like 10 times, so if anyone actually figures it out send us the answers
const questions = [
  {
    "question": "By convention, what name is used for the first key in a JSON schema?",
    "answers": [
      "schema",
      "$schema",
      "JsonSchema",
      "JSONschema"
    ]
  },
  {
    "question": "Which JavaScript method converts a JavaScript value to Json?",
    "answers": [
      "JSON.parse()",
      "JSON.stringify()",
      "JSON.toString()",
      "JSON.objectify()"
    ]
  },
  {
    "question": "Which data type is NOT part of JSON standard?",
    "answers": [
      "string",
      "number",
      "date",
      "array"
    ]
  },
  {
    "question": "Which term is commonly used to refer to converting data to JSON?",
    "answers": [
      "unpacking",
      "serialization",
      "deserialization",
      "parsing"
    ]
  },
  {
    "question": "Which data type is part of the JSON standard?",
    "answers": [
      "Boolean",
      "map",
      "promise",
      "function"
    ]
  },
  {
    "question": "Which key name is used to specify properties that must be included for JSON to be valid?",
    "answers": [
      "important",
      "base",
      "core",
      "required"
    ]
  },
  {
    "question": "How do you store several paragraphs of text as a string in JSON?",
    "answers": [
      "Escape all whitespaces expect space characters.",
      "Escape line breaks.",
      "Escape paragraphs.",
      "Remove all whitespaces"
    ]
  },
  {
    "question": "If you need to store the loggedIn status of a user in JSON as a boolean, what is the correct syntax?",
    "answers": [
      "\"loggedIn\": (true)",
      "loggedIn: \"true\"",
      "\"loggedIn\": true",
      "loggedIn: {true}"
    ]
  },
  {
    "question": "Which value is supported in the JSON specifications?",
    "answers": [
      "undefined",
      "infinity",
      "NaN",
      "null"
    ]
  },
  {
    "question": "Which JavaScript method converts JSON to a JavaScript value?",
    "answers": [
      "JSON.parse()",
      "JSON.stringify()",
      "JSON.toString()",
      "JSON.objectify()"
    ]
  },
  {
    "question": "Can trailing commas be used in objects and arrays?",
    "answers": [
      "yes",
      "only if there is more than one item",
      "no",
      "only when arrays and objects contain more than 10 items"
    ]
  },
  {
    "question": "Which whitespace characters should be escaped within a string?",
    "answers": [
      "All whitespace is allowed.",
      "double quotes, slashes new lines, and carriage returns",
      "new lines and carriage returns only",
      "double quotes only"
    ]
  },
  {
    "question": "Which is supported by YAML but not supported by JSON?",
    "answers": [
      "nested",
      "comments",
      "arrays",
      "null values"
    ]
  },
  {
    "question": "How do you encode a date in JSON?",
    "answers": [
      "Convert the date to UTC and enclose in quotes.",
      "Encode the date as string using the ISO-8601 date format.",
      "Wrap the date in double quotes.",
      "Add a \"date\" key to your object and include the date as string."
    ]
  },
  {
    "question": "What tool might you use to validate your JSON?",
    "answers": [
      "JSONLint",
      "ValidateJSON",
      "JSONFiddle",
      "TextEdit"
    ]
  },
  {
    "question": "What characters denote strings in JSON?",
    "answers": [
      "double quotes",
      "smart (curly) quotes",
      "single or double quotes",
      "single quotes"
    ]
  },
  {
    "question": "Why do so many APIs use JSON?",
    "answers": [
      "Because it's object-based.",
      "Because it's a simple and adaptable format for sharing data.",
      "Because it's based on JavaScript.",
      "Because it is derived from SGML."
    ]
  },
  {
    "question": "When building dynamic web applications using AJAX, developers originally used the _ data format, which has since been replaced by JSON.",
    "answers": [
      "XML",
      "GRAPHQL",
      "REST",
      "SOAP"
    ]
  },
  {
    "question": "How is a true boolean value represented in JSON?",
    "answers": [
      "TRUE",
      "\"true\"",
      "1",
      "true"
    ]
  },
  {
    "question": "Which array is valid JSON?",
    "answers": [
      "['tatooine', 'hoth', 'dagobah']",
      "[tatooine, hoth, dagobah]",
      "[\"tatooine\", \"hoth\", \"dagobah\",]",
      "[\"tatooine\", \"hoth\", \"dagobah\"]"
    ]
  },
  {
    "question": "Which is ignored by JSON but treated as significant by YAML?",
    "answers": [
      "trailing commas",
      "trailing decimals",
      "whitespace",
      "leading zeroes"
    ]
  },
  {
    "question": "When you need to set the value of a key in JSON to be blank, what is the correct syntax for the empty value?",
    "answers": [
      "FALSE",
      "0",
      "\"\"",
      "null"
    ]
  },
  {
    "question": "How do you assign a number value in JSON?",
    "answers": [
      "Escape the number with a backslash.",
      "Enclose the number in double quotes.",
      "Enclose the number in single quotes.",
      "Leave the number as is."
    ]
  },
  {
    "question": "Which reference to the Unicode character U+1F602 complies with the JSON standard?",
    "answers": [
      "128514",
      "d83dde02",
      "\\uD83D\\uDE02",
      "\\&#128514;"
    ]
  },
  {
    "question": "Which code uses the correct JSON syntax for a key/Value pair containing a string?",
    "answers": [
      "\"largest\": \"blue whale\"",
      "largest: 'blue whale'",
      "'largest': 'blue whale'",
      "largest: \"blue whale\""
    ]
  },
  {
    "question": "Which key name is used to specify data type in a JSON schema?",
    "answers": [
      "data",
      "schemadata",
      "schematype",
      "type"
    ]
  },
  {
    "question": "Which data format is a JSON schema written in?",
    "answers": [
      "markdown",
      "YAML",
      "XML",
      "JSON"
    ]
  },
  {
    "question": "Which code is valid JSON equivalent of the key/value pair shown that also preserves the data type?",
    "answers": [
      "\"variance\": \"-0.0823\"",
      "variance: \"-0.0823\"",
      "\"variance\": \"\\-0.0823\"",
      "variance: -0.0823"
    ]
  },
  {
    "question": "With what character should key/value pairs be separated?",
    "answers": [
      "colon",
      "space",
      "semicolon",
      "comma"
    ]
  },
  {
    "question": "What character separates keys from values?",
    "answers": [
      ":",
      "->",
      "::",
      "."
    ]
  },
  {
    "question": "Which number types are available in javascript but not supported in json?",
    "answers": [
      "Fractional and Transcendental",
      "Infinity or Rational",
      "Rational and Irrational",
      "Infinity or NaN"
    ]
  },
  {
    "question": "How should a date value be stored in JSON?",
    "answers": [
      "As a string with quotes",
      "As a string without quotes",
      "As a string in ISO 8583 format",
      "As a string in ISO 8601 format"
    ]
  },
  {
    "question": "What data structure do you use to encode ordered information?",
    "answers": [
      "list",
      "array",
      "struct",
      "indexed hash"
    ]
  },
  {
    "question": "What are valid values in JSON?",
    "answers": [
      "arrays, strings, numbers, true/false",
      "hashes, arrays, strings, numbers, booleans, null",
      "arrays, objects, lists, strings, numbers, booleans",
      "objects, arrays, strings, numbers, booleans, null"
    ]
  },
  {
    "question": "Which key format is valid JSON?",
    "answers": [
      "key: \"value\"",
      "\"key\": \"value\"",
      "key, \"value\"",
      "'key': 'value'"
    ]
  },
  {
    "question": "How should comments be formatted in JSON?",
    "answers": [
      "Wrap the comments in single quotes and place it at the bottom of the file.",
      "Wrap the comments in double parentheses.",
      "Escape comments by placing two slashes at the start of the comment.",
      "JSON does not support comments."
    ]
  },
  {
    "question": "How are values separated in JSON?",
    "answers": [
      "with brackets",
      "with colons",
      "with commas",
      "with parentheses"
    ]
  },
  {
    "question": "With which programming language is JSON best used?",
    "answers": [
      "any language, as JSON is language agnostic.",
      "Ruby",
      "JavaScript",
      "Python"
    ]
  },
  {
    "question": "What values can arrays contain?",
    "answers": [
      "only numbers",
      "any valid JSON value",
      "only strings and numbers",
      "only strings"
    ]
  },
  {
    "question": "What technique can be used to represent complex objects with JSON?",
    "answers": [
      "reserialization",
      "nesting",
      "memorization",
      "minimization"
    ]
  },
  {
    "question": "What characters are used to enclose an array?",
    "answers": [
      "[]",
      "{}",
      "\"\"",
      "()"
    ]
  },
  {
    "question": "What is the official MIME type for JSON?",
    "answers": [
      "text/json",
      "text/javascript",
      "application/json",
      "data/json"
    ]
  },
  {
    "question": "What character cannot be part of string within JSON without additional formatting?",
    "answers": [
      "/",
      "\"",
      "-",
      ":"
    ]
  },
  {
    "question": "What is the purpose of JSON?",
    "answers": [
      "to provide a simple way to serialize and deserialize data between different sources",
      "to provide a way to store data for machine learning",
      "to provide an archival solution for data warehousing",
      "to provide a way for JavaScript to run other languages"
    ]
  },
  {
    "question": "What is the maximum number of key/value pairs that JSON supports?",
    "answers": [
      "10,000",
      "1000",
      "There is no defined limit.",
      "1 million"
    ]
  },
  {
    "question": "What is the recommended term used to refer to multiple resources?",
    "answers": [
      "a swarm",
      "multiple resources",
      "a collection",
      "a group"
    ]
  },
  {
    "question": "Does JSON support signed numbers?",
    "answers": [
      "yes, but only if they are enclosed in quotes",
      "only with integers",
      "no",
      "yes"
    ]
  },
  {
    "question": "What two nonnumerical characters can numbers contain?",
    "answers": [
      "dash and dot",
      "dash and comma",
      "comma and exclamation point",
      "dot and comma"
    ]
  },
  {
    "question": "What JavaScript method is used to load JSON data?",
    "answers": [
      "JSON.ingest()",
      "JSON.convert()",
      "JSON.read()",
      "JSON.parse()"
    ]
  },
  {
    "question": "How are the values in an array separated?",
    "answers": [
      "with right arrows",
      "with colons",
      "with semicolons",
      "with commas"
    ]
  },
  {
    "question": "What is the minimum number of values in an array?",
    "answers": [
      "zero",
      "one",
      "two",
      "three"
    ]
  },
  {
    "question": "In JSON, a set of brackets ([]) is used to denote _, whereas curly braces ({}) denote _.",
    "answers": [
      "arrays; objects",
      "objects; functions",
      "arrays; functions",
      "key/value pairs; arrays"
    ]
  },
  {
    "question": "How does JSON represent truth, falsity and nullness?",
    "answers": [
      "true, false, null",
      "true, false",
      "TRUE, FALSE, NULL",
      "true, false, null"
    ]
  },
  {
    "question": "If an object key contains spaces, how can you access its value in JavaScript?",
    "answers": [
      "Remove spaces from the key before accessing the value.",
      "Use dot notation to access the value.",
      "Use object key index to access the value.",
      "Use bracket notation to access the value."
    ]
  },
  {
    "question": "When parsing JSON, \"caching\" is a method used to _.",
    "answers": [
      "remove duplicate data from a server",
      "temporarily store data for faster access",
      "store excess information in chunks to be reviewed later",
      "clog up a web browser with useless information"
    ]
  },
  {
    "question": "What is the only valid whitespace character within a string that does not require an escape character?",
    "answers": [
      "line break",
      "space",
      "tab",
      "return"
    ]
  },
  {
    "question": "What technique can you use to safely encode very large numbers?",
    "answers": [
      "Store the number as a string",
      "Convert the number into an exponent.",
      "Round the number to the nearest 10-digit number.",
      "Split the number into smaller parts."
    ]
  },
  {
    "question": "What characters are used to define an object?",
    "answers": [
      "||",
      "{}",
      "()",
      "[]"
    ]
  },
  {
    "question": "The JSON structure features nested objects and arrays. Sometimes the data containing these features exists in relational databases. How is the relational structure different that JSON?",
    "answers": [
      "It has a flat architecture.",
      "It has a rewritable structure.",
      "It has an array-only structure.",
      "It has a table structure."
    ]
  }
];