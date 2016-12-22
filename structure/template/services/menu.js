var fs = require("fs");

exports.sort_menu = function(dragged_item, dropped_item) {

  console.log(dragged_item);
  console.log(dropped_item);

  // fileRoute = __dirname + '/../workspace/' + id_information_system + '/routes/' + name_data_entity.toLowerCase() + '.js';
  fileLayout = __dirname + '/../views/layout_home.jade';

  data = fs.readFileSync(fileLayout, 'utf8');

  // Calculate tabs shifting in decalage variable
  var array = data.split("\n");
  i = 0;
  l = array.length;
  bfound = false;
  var decalage = 0;
  while ((i < l) && (!bfound)) {
      if (array[i].indexOf('// ' + dragged_item) != -1) {
        tmp = array[i].split("\t");
        decalage = tmp.length -1;
        bFound = true;
      }
      i++;
  }

  // Set tabs according to decalage value
  i = 0;
  tabs = "";
  while (i < decalage) {
    tabs = tabs + "\t";
    i++;
  }

  // Isolate Item to move
  var array = data.split('// ' + dragged_item);
  code_content = '// ' + dragged_item;
  code_content = code_content + array[1];
  code_content = code_content + '// ' + dragged_item + '\n\n';
  // code_content = code_content + tabs + '// ' + dropped_item;

  // Rebuild file without dragged item
  new_array = array[0] + array [2];

  var result = "";

  // Moving up
  if (array[0].indexOf('// ' + dropped_item) != -1) {

    // Insert code content in new file
    code_content = code_content + tabs + '// ' + dropped_item;

    result = new_array.replace('// ' + dropped_item, code_content);
  }
  else {
    // Moving down

    // Find position of dropped item
    new_array = new_array.split('// ' + dropped_item);

    array = new_array[0] + '// ' + dropped_item;
    array = array + new_array[1];
    array = array + '// ' + dropped_item + '\n\n';

    // Insert code in after last tag of dropped item
    result = array + tabs + code_content + new_array[2];

  }

  var stream_fileLayout = fs.createWriteStream(fileLayout);
  stream_fileLayout.write(result);
  stream_fileLayout.end();
  stream_fileLayout.on('finish', function () {
    console.log('Menu has been updated');
  });


}

module.exports = exports;
