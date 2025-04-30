if (drainage !== null && Array.isArray(drainage) && drainage.length > 0) {

    $('#drainage_label').show();
    $('#drainagesection').show();

    // Add tfoot dynamically if it doesn't exist
    if ($('#drainagereport tfoot').length === 0) {
        $('#drainagereport').append(`
            <tfoot>
                <tr>
                    <th colspan="6" style="text-align:right">Total Length (KM):</th>
                    <th></th>
                </tr>
            </tfoot>
        `);
    }

    $('#drainagereport').DataTable({
        dom: 'frtip',
        buttons: ['csv'],
        searching: false,
        info: false,
        data: drainage,
        paging: false,
        destroy: true,
        columnDefs: [],
        columns: [
            { title: 'Uuid', data: 'uuid' },
            { title: 'River name', data: 'rivname' },
            { title: 'Ril Code', data: 'rilcode' },
            { title: 'Basin', data: 'basin' },
            { title: 'Ba Code', data: 'bacode' },
            { title: 'Ordsh', data: 'ordsh' },
            {
                title: 'Length (KM)',
                data: 'length_km',
                render: function (data, type, row) {
                    return (typeof data === 'number') ? data.toFixed(2) : data;
                }
            }
        ],
        footerCallback: function (row, data, start, end, display) {
            const totalLength = data.reduce((sum, row) => {
                return sum + (parseFloat(row.length_km) || 0);
            }, 0);

            // Format the total and update the footer
            $(this.api().column(6).footer()).html(totalLength.toFixed(2));
        }
    });

    $("#crossing").text(function (i, oldValue) {
        return parseInt(oldValue, 10) + 1;
    });
}
