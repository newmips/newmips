var readline = require('readline');
var fs = require('fs');

var path = process.argv.length > 2 ? process.argv[2] : '../public/css/font-awesome.css';

console.log('Opening css file : ' + path + '\n');

var rl = readline.createInterface({
    input: fs.createReadStream(path)
});

// Read file line by line
var lines = [];
rl.on('line', function(line) {
    if (line.indexOf('.fa-') == 0 && line.indexOf(':before') != -1)
        lines.push(line);
});

rl.on('close', function() {
    console.log(lines.length + " fa classes found.\n");
    var classes = '[';
    for (var i = 0; i < lines.length; i++) {
        var faClass = lines[i].substring(1, lines[i].indexOf(':before'));
        classes += "'" + faClass + "'";
        if (i < lines.length)
            classes += ',';
    }
    classes += ']';

    fs.writeFile("fa-classes.txt", classes, function(err) {
        if (err) {
            return console.log(err);
        }

        console.log("Done.");
    });
});