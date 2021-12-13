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
        <!-- <a class="navbar-item is-primary " @click="downloadAsMerkleTree()" >
          <p>MERKLE TREE</p>
        </a> -->
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
          <tbody v-if="submissions.length == 0">
            <tr>LOADING...</tr> 
          </tbody>
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
          <h3>
            <a href="https://humanity.tools">humanity.tools</a>
          </h3>
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from 'axios'
import merkletree from 'merkletreejs'
import SHA256 from 'crypto-js/sha256'
import moment from 'moment';

export default {
  name: 'List',
  data () {
    return {
      max: 500,
      submissions: [],
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
    downloadAsMerkleTree(){
      let leaves = []
      this.submissions.forEach((item, index)=>{
        leaves.push(item.id)
      })
      console.log(leaves)
      let sha_leaves = leaves.map(x => SHA256(x))
      console.log(sha_leaves)
      let tree = new MerkleTree(sha_leaves, SHA256)
      let root = tree.getRoot().toString('hex')
      MerkleTree.print(tree);
      console.log("Root: ",root);
      // const leaf = SHA256('a')
      // const proof = tree.getProof(leaf)
      // console.log(tree.verify(proof, leaf, root))
      console.info("Compatible with: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol#L6-L10")

      // var link = document.createElement('a');
      // var filename = 'tree';  
      // link.style.display = 'none';
      // link.setAttribute('target', '_blank');
      // link.setAttribute('href', 'data:text/txt;charset=utf-8,' + encodeURIComponent(tree));
      // link.setAttribute('download', filename);
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);

      var link = document.createElement('a');
      var filename = 'root';  
      link.style.display = 'none';
      link.setAttribute('target', '_blank');
      link.setAttribute('href', 'data:text/txt;charset=utf-8,' + encodeURIComponent(root));
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

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
        let inc = 1000;
        let id = 0;
        let count = 0;
        let limit = 11000;
        let data = {"submissions":[]};
        this.submissions = []

        while(count <= limit){
            let query = '{submissions(first: 1000, where: {id_gt:"'+id+'", registered: true}){id creationTime submissionTime status registered name }}';
            // console.log(query);
            let response = await axios.post("https://api.thegraph.com/subgraphs/name/kleros/proof-of-humanity-mainnet", {query: query})
                .then((res)=>{
                    console.log(res.data);
                    return res;
                })
                .catch((error)=>{
                    console.log(error);
                    return false;
                })
            if(!response){count = limit+1; return false;}

            for (var i = 0; i < response.data.data.submissions.length; i++) {
               this.submissions.push(response.data.data.submissions[i]);
            }
            count+=inc;
            id = String(response.data.data.submissions[response.data.data.submissions.length - 1].id);
            // console.log("next i ", i);
            // console.log("next count ", count);
            this.submissions.sort((a, b) => a.submissionTime - b.submissionTime );
            // this.submissions = data.submissions;
        }


    }

  }
}
</script>

