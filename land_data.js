if (land_data !== null && Array.isArray(land_data) && land_data.length > 0) {

    $('#land_label').show();
    $('#landSection').show();

    // Add footer row if not present
    if ($('#landreport tfoot').length === 0) {
        let footerHtml = '<tfoot><tr>';
        const columnCount = 12; // Adjust this to your actual column count
        for (let i = 0; i < columnCount; i++) {
            if (i === 10) {
                footerHtml += `<th style="text-align:right">Total Area:</th>`; // Title in column 11
            } else if (i === 11) {
                footerHtml += '<th></th>'; // Will be filled with area total
            } else {
                footerHtml += '<th></th>';
            }
        }
        footerHtml += '</tr></tfoot>';
        $('#landreport').append(footerHtml);
    }

    $('#landreport').DataTable({
        dom: 'frtip',
        buttons: ['csv'],
        searching: false,
        info: false,
        data: land_data,
        paging: false,
        destroy: true,
        columns: [
            { title: "Bhucode", data: "bhucode" },
            { title: "Khasra id", data: "khasra_id" },
            { title: "Kid", data: "kid" },
            { title: "Plot type", data: "plot_type" },
            { title: "Ulpin", data: "ulpin" },
            { title: "Khasraarea", data: "khasraarea" },
            { title: "Land type", data: "land_type" },
            { title: "Name distr", data: "name_distr" },
            { title: "Name tehsi", data: "name_tehsi" },
            { title: "Village na", data: "village_na" },
            { title: "Villagecod", data: "villagecod" },
            { title: "Row Area (Ha)", data: "area" }
        ],
        footerCallback: function (row, data, start, end, display) {
            let totalArea = 0;
            data.forEach(row => {
                totalArea += parseFloat(row.area) || 0;
            });

            const api = this.api();
            api.column(11).footer().innerHTML = totalArea.toFixed(2); // 12th column (index 11)
        }
    });

    $("#crossing").text(function (i, oldValue) {
        return parseInt(oldValue, 10) + 1;
    });
}
