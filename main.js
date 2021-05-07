let global_data = null;

async function multiLoadGraphData(){
    let max = 5000;
    let inc = 500;

    function makeRequest(i) {
        // console.log("Add promise")
        return new Promise((resolve) => {
            let query = "{submissions(where:{registered: true}, first: 500, skip:"+i+"){id creationTime submissionTime status registered name vouchees{id} requests{evidence{sender URI}}}}";
            let response = axios.post("https://api.thegraph.com/subgraphs/name/kleros/proof-of-humanity-mainnet", {query: query})
                .then((res)=>{
                    // console.log(res.data);
                    return res;
                })
                .catch((error)=>{
                    console.log(error);
                    return false;
                })
            resolve(response);
        });
    }

    async function process(arrayOfPromises) {
        console.time(`process`);
        let responses = await Promise.all(arrayOfPromises);
        let data = {"submissions":[]};

        for(let r of responses) {
            // console.log("R", r);
            for (var i = 0; i < r.data.data.submissions.length; i++) {
               data["submissions"].push(r.data.data.submissions[i]);
            }
        }
        console.timeEnd(`process`);
        return data;
    }

    async function handler() {
        let arrayOfPromises = []
        for(var i = 0; i < max; i+=inc) {
            arrayOfPromises.push(makeRequest(i))
        }
        let data = await process(arrayOfPromises);
        console.log(`processing is complete`);
        return data;
    }

    let data = await handler();

    data.submissions.sort((a, b) => a.submissionTime - b.submissionTime );

    for (var i = 0; i < data.submissions.length; i++) {
        let row = "<tr><td>"+data.submissions[i].name+"</td><td>"+data.submissions[i].id+"</td><td>"+data.submissions[i].registered+"</td><td>"+data.submissions[i].status+"</td><td>"+data.submissions[i].creationTime+"</td><td>"+data.submissions[i].submissionTime+"</td></tr>";
        // console.log
        $('#humans_table_body').append(row)
        
    }


    $('#num').html(data.submissions.length)
    global_data = data.submissions
}


multiLoadGraphData()

function downloadAsCSV(table_id, separator = ','){
    // Select rows from table_id
    var rows = document.querySelectorAll('table#' + table_id + ' tr');
    // Construct csv
    var csv = [];
    for (var i = 0; i < rows.length; i++) {
        var row = [], cols = rows[i].querySelectorAll('td, th');
        for (var j = 0; j < cols.length; j++) {
            // Clean innertext to remove multiple spaces and jumpline (break csv)
            var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
            // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
            data = data.replace(/"/g, '""');
            // Push escaped string
            row.push('"' + data + '"');
        }
        csv.push(row.join(separator));
    }
    var csv_string = csv.join('\n');
    // Download it
    var filename = 'export_' + table_id + '_' + new Date().toLocaleDateString() + '.csv';
    var link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}