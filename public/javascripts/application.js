var iframeTarget = {
  get: function(){
    var frame = document.getElementById('target');
    return frame.contentDocument || frame.contentWindow.document;
  },
  update: function(html, code, callback) {
    var preview =  this.get();
    preview.open();
    preview.write(html+'<script src="http://localhost:3000/javascripts/jquery.js"></script><script src="http://localhost:3000/socket.io/socket.io.js"></script><script src="http://localhost:3000/javascripts/scraper.js"></script><script id="scraper_code">document.run = function(){'+ code +'}</script>');
    preview.close();
    callback(preview);
  }
}

document.addEventListener("DOMContentLoaded", function(){
  window.socket = io.connect(window.location.hostname);
  window.id = $("div.scraper").attr("id");

  var code_textarea = $("#code")
    , code_editor = CodeMirror.fromTextArea(code_textarea[0], {
    mode: "javascript",
    theme:"monokai",
    value: code_textarea.val(),
    lineNumbers: true,
    gutter: true,
    matchBrackets: true,
    indentWithTabs:true,
    indentUnit:4,
    tabSize:2,
    fixedGutter:true,
    onChange: function(editor) {
      socket.emit('save_code', { code: editor.getValue(), id: id  });
    }
  });

  socket.on("run", function(scraper){
    iframeTarget.update(scraper.html, scraper.code, function(code){
      code.run();
      $(".loading").hide();
      socket.emit("sync_result_database", window.id);
    });
  });

  socket.on("data_to_iframe", function(html){
    iframeTarget.update(html, "", function(code){
      console.log("Loaded");
    });
  });

  socket.on("update_result", function(data){
    var table = "<table>";
    for (var _i in data) {
      var row = data[_i];
      table += "<tr>";
      if(typeof(row) == "object"){
        for(var _j in row){
          column = row[_j];
          table += "<td>" + column + "</td>";
        }
      }
      table += "</tr>";
    }
    table += "</table>";
    $("#result").html(table);
  });

  $("#run_code").live("click", function(e){
    socket.emit('get_to_run', id);
    $(".loading").show();
    e.preventDefault();
  });

  socket.emit('popule_iframe', id);

}, false);