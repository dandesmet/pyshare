jQuery(function($){

    Dropzone.autoDiscover = false;

    if (!("WebSocket" in window)) {
        alert("Your browser does not support web sockets");
    } else{
        setup();
    }


    function setup(){
   
        // Note: You have to change the host var 
        // if your client runs on a different machine than the websocket server
    
        var host = "ws://localhost:9090/ws";
        var uploadUrl = "http://localhost:9090/upload"
        var socket = new WebSocket(host);
        //console.log("socket status: " + socket.readyState);   

        new Dropzone("a#upload-btn",
        {
            url: 'http://localhost:9090/upload',
            paramName: 'fileUpload',
            previewsContainer: false
        });
    
        var $txt = $("#data");
        var $btnSend = $("#sendtext");
        var $upload = $("#fileUploadField")

        $txt.focus();

        // event handlers for UI
        $btnSend.on('click',function(){
            var text = $txt.val();
            if(text == ""){
                return;
            }
            socket.send(text);
            $txt.val("");    
        });

        $upload.change(function() {
            var formData = new FormData();
            formData.append("fileUpload", document.getElementById("fileUploadField").files[0]);

            var xhr = new XMLHttpRequest();
            xhr.open("POST", uploadUrl);
            xhr.send(formData);
        });

        $txt.keypress(function(evt){
            //if(evt.which == 13){
                //$btnSend.click();
            //}
        });

        // event handlers for websocket
        if(socket){

            socket.onopen = function(){
                //alert("connection opened....");
            }

            socket.onmessage = function(msg){
                if (msg.data.indexOf('#[!FILE:') == 0) {
                    // this is a file; add a notification to the files section
                    slideFileResponse(msg.data);
                } else {
                    showMessageResponse(msg.data);
                }
            }

            socket.onclose = function(){
                //alert("connection closed....");
                showMessageResponse("The connection has been closed.");
            }

        } else {
            console.log("invalid socket");
        }

        function slideFileResponse(txt) {
            filepath = txt.slice(8);
            parts = filepath.split('/');
            name = parts[parts.length -1];

            //class="btn btn-default dl-button"

            html = $('<li><a href="' + filepath + '" class="btn btn-success dl-button" download>' + name + '</a></li>');
            
            // these CSS manipulations are only safe because I know from my own stylesheet that we're not using those properties
            if ($('ul.dl-list li').length) {
                $('<li><a href="' + filepath + '" class="btn btn-success dl-button" download>' + name + '</a></li>').hide().prependTo('ul.dl-list').slideDown(800);
            } else {
                $('ul.dl-list').append(html);
            }
            

        }

        function showFileResponse(txt) {
            // function assumes that it will only be called for messages with the special
            // file prefix

            // TODO this is a copy-paste of the below method; if this is not going to change, fix it
            filepath = txt.slice(8);
            parts = filepath.split('/');
            name = parts[parts.length - 1];
            html = $('<div><a href="' + filepath + '" download class="btn btn-default dl-button">' + name + '</a></div>');

            if ($('#files div').length) {
                // nth message
                $('#files div:first').before(html);
            } else {
                // first message
                $('#files').append(html);
            }

        }

        function showMessageResponse(txt) {
            
            val = '<div><pre>' + txt + '</pre></div>';

            if ($('#messages div').length) {
                // nth message
                $('#messages div:first').before(val);
            } else {
                // first message
                $('#messages').append(val);
            }

            //$("#messages").append('<div><p>' + txt + '</p></div>');
            //$("#messages").accordion('refresh');

            //var p = document.createElement('p');
            //p.innerHTML = txt;
            //document.getElementById('output').appendChild(p); 
        }   
    }
});