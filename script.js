let currentPage = 1;
const pageSize = 10;

document.addEventListener("DOMContentLoaded", function () {
    fetchData();

    document.getElementById("prevPage").addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            fetchData();
        }
    });

    document.getElementById("nextPage").addEventListener("click", function () {
        currentPage++;
        fetchData();
    });
});

function fetchData() {
    debugger;
    fetch(`http://localhost:9090/api/roads?page=${currentPage}&size=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (data.data.length === 0 && currentPage > 1) {
                currentPage--;
                return;
            }

            renderTable(data.data);
            document.getElementById("pageInfo").innerText = `Page ${data.currentPage} of ${data.totalPages}`;

            document.getElementById("prevPage").disabled = (currentPage === 1);
            document.getElementById("nextPage").disabled = (currentPage >= data.totalPages);
        })
        .catch(error => console.error("Error fetching data:", error));
}

function renderTable(data) {
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");

    tableHeader.innerHTML = "";
    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='100%'>No data available</td></tr>";
        return;
    }

    // Generate table headers dynamically
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        tableHeader.appendChild(th);
    });

    // Populate table rows
    data.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach(header => {
            const td = document.createElement("td");
            td.textContent = row[header];
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}
