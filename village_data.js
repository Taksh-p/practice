if (vill_data !== null && Array.isArray(vill_data) && vill_data.length > 0) {

    $('#no_village').text(vill_data.length);
    $('#village_label').show();
    $('#villagesection').show();

    // Columns except geometry
    const columns1 = Object.keys(vill_data[0]).filter(key => !key.includes('geom')).map(key => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        data: key
    }));

    // Dynamically add footer if not exists
    if ($('#villagereport tfoot').length === 0) {
        let footerHtml = '<tfoot><tr>';
        columns1.forEach((col, i) => {
            if (i === 2) {
                footerHtml += `<th style="text-align:right">Total Population:</th>`;
            } else if (i === 3 || i === 4 || i === 5) {
                footerHtml += '<th></th>'; // Will fill dynamically
            } else {
                footerHtml += '<th></th>';
            }
        });
        footerHtml += '</tr></tfoot>';
        $('#villagereport').append(footerHtml);
    }

    $('#villagereport').DataTable({
        dom: 'frtip',
        buttons: ['csv'],
        data: vill_data,
        paging: false,
        searching: false,
        info: false,
        destroy: true,
        columns: columns1,
        footerCallback: function (row, data, start, end, display) {
            let total = 0, male = 0, female = 0;

            data.forEach(row => {
                total += parseInt(row.total) || 0;
                male += parseInt(row.male) || 0;
                female += parseInt(row.female) || 0;
            });

            const api = this.api();
            api.column(3).footer().innerHTML = total;
            api.column(4).footer().innerHTML = male;
            api.column(5).footer().innerHTML = female;
        }
    });

    $("#crossing").text(function (i, oldValue) {
        return parseInt(oldValue, 10) + 1;
    });

    const result = vill_data.map(item => `${item.village}(${item.total})`).join(', ');
    $('#noOfVillage1').html(vill_data.length);
}
