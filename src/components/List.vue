<template>
  <div>
    <nav class="navbar is-danger" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <span class="navbar-item">
        <p><b>LIST.HUMANITY.TOOLS</b></p>
        </span>
        <span class="navbar-item">
        <p>THE FIRST <b>{{ submissions.length }}</b> HUMANS</p>
        </span>
        <a class="navbar-item is-primary " @click="downloadAsCSV('humans_table')" >
          <p>DOWNLOAD CSV</p>
        </a>
      </div>
    </nav>
    <div class="table-container" style="max-height: 80vh;overflow: scroll;margin-bottom: 0px;">


      <table id="humans_table" class="table is-hoverable is-bordered is-fullwidth">
          <thead class="bg-primary">
              <th>MM/DD/YYYY</th>
              <th>NAME</th>
              <th>ADDRESS</th>
              <!-- <th>REGISTERED</th> -->
              <!-- <th>STATUS</th> -->
          </thead>
          <tbody id="humans_table_body">
              <tr v-for="submission in submissions">
                <td>{{submission.submissionTime | formatUnix()}}
                <td style="max-width: 300px; overflow:hidden;">{{submission.name}}</td>
                <td>{{submission.id}}</td>
                <!-- <td>{{submission.registered}}</td> -->
                <!-- <td>{{submission.status}}</td> -->
                </td>
              </tr>
          </tbody>
      </table>
    </div>
    <footer class="footer" style="background: hsl(348, 86%, 61%)">
      <div class="content has-text-centered">
        <p style="color: hsl(0, 0%, 96%)">
          <b>Something wrong? <a href="https://github.com/isaac-art/listRegistered">Let me know</a></b>
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from 'axios'

import moment from 'moment';
export default {
  name: 'List',
  data () {
    return {
      max: 5000,
      submissions: null,
    }
  },
  mounted(){
    this.multiLoadGraphData()
  },
  filters: {
    formatUnix: function (value) {
      if (value) {
        return moment.unix(value).format('MM/DD/YYYY')
      }
    }
  },
  methods: {
    downloadAsCSV(table_id, separator = ','){
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
    },

    async multiLoadGraphData(){
        let max = this.max;
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

        this.submissions = data.submissions;
    }

  }
}
</script>

