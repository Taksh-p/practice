ALTER TABLE dprprojects_mppwd ADD COLUMN status VARCHAR(20) DEFAULT 'Pending';
ALTER TABLE dprprojects_mppwd ADD COLUMN current_stage VARCHAR(20) DEFAULT 'DISTRICT';


@Entity
public class DprProject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String approvaltype;
    private String status; // Pending, Approved, Rejected
    private String currentStage; // DISTRICT, CIRCLE, ZONE

    // Getters and Setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }
}


@PostMapping("/forward/{token}")
public String forward(@PathVariable("token") String token,
    @RequestParam("jsondatanoc2") String jsondatanoc2,
    @RequestParam("tblname") String tblname,
    HttpSession session) {

    if (Objects.nonNull(session.getAttribute("isloginsso"))) {
        String decryptedId = getDecryptedValue(jsondatanoc2);
        Integer id = Integer.parseInt(decryptedId);
        String action = getDecryptedValue(tblname); // forward or backward

        Optional < DprProject > dprProjectOpt = dprRepo.findById(id);

        if (dprProjectOpt.isPresent()) {
            DprProject project = dprProjectOpt.get();
            String currentStage = project.getCurrentStage();

            if (action.equalsIgnoreCase("forward")) {
                if (currentStage.equalsIgnoreCase("DISTRICT")) {
                    project.setCurrentStage("CIRCLE");
                    project.setStatus("Pending"); // Set to pending for Circle
                } else if (currentStage.equalsIgnoreCase("CIRCLE")) {
                    project.setCurrentStage("ZONE");
                    project.setStatus("Pending"); // Set to pending for Zone
                } else if (currentStage.equalsIgnoreCase("ZONE")) {
                    project.setStatus("Approved"); // Final Approval, do NOT override below
                }
            } else if (action.equalsIgnoreCase("backward")) {
                if (currentStage.equalsIgnoreCase("ZONE")) {
                    project.setCurrentStage("CIRCLE");
                } else if (currentStage.equalsIgnoreCase("CIRCLE")) {
                    project.setCurrentStage("DISTRICT");
                }
                project.setStatus("Pending"); // Only set Pending when sent backward
            }

            // Save only after setting the correct status
            dprRepo.save(project);
            // Reset to Pending until Zone approves
            dprRepo.save(project);
        }
        return "redirect:/dprsummaryreport";
    }
    return null;
}


@PostMapping("/approveReject/{token}")
public String approveReject(@PathVariable("token") String token,
    @RequestParam("jsondatanoc2") String jsondatanoc2,
    @RequestParam("tblname") String tblname,
    HttpSession session) {

    if (Objects.nonNull(session.getAttribute("isloginsso"))) {
        String decryptedId = getDecryptedValue(jsondatanoc2);
        Integer id = Integer.parseInt(decryptedId);
        String action = getDecryptedValue(tblname); // approve or reject

        Optional < DprProject > dprProjectOpt = dprRepo.findById(id);

        if (dprProjectOpt.isPresent()) {
            DprProject project = dprProjectOpt.get();

            if (action.equalsIgnoreCase("approve")) {
                project.setStatus("Approved");
            } else if (action.equalsIgnoreCase("reject")) {
                project.setStatus("Rejected");
            }

            dprRepo.save(project);
        }
        return "redirect:/dprsummaryreport";
    }
    return null;
}


$('#notificationtableuser').DataTable({
    dom: 'Bfrtip',
    buttons: ['csv'],
    data: data,
    "columnDefs": [
        {
            "targets": 1, "name": "Forward", visible: true, data: "id",
            "render": function (data, type, row, meta) {
                if (row.currentStage === 'DISTRICT' && row.status === 'Pending') {
                    var encryptedAES = CryptoJS.AES.encrypt(data.toString(), "My approval key");
                    var encryptedAES1 = CryptoJS.AES.encrypt("forward", "My approval key");
                    return '<button onclick="processRequest(\'' + encryptedAES + '\',\'' + encryptedAES1 + '\')" type="button" class="btn btn-primary">Forward</button>';
                }
                return '';
            }
        },
        {
            "targets": 2, "name": "Backward", visible: true, data: "id",
            "render": function (data, type, row, meta) {
                if (row.currentStage === 'CIRCLE' && row.status === 'Pending') {
                    var encryptedAES = CryptoJS.AES.encrypt(data.toString(), "My approval key");
                    var encryptedAES1 = CryptoJS.AES.encrypt("backward", "My approval key");
                    return '<button onclick="processRequest(\'' + encryptedAES + '\',\'' + encryptedAES1 + '\')" type="button" class="btn btn-danger">Backward</button>';
                }
                return '';
            }
        },
        {
            "targets": 3, "name": "Approve/Reject", visible: true, data: "id",
            "render": function (data, type, row, meta) {
                if (row.currentStage === 'ZONE' && row.status === 'Pending') {
                    var encryptedAES = CryptoJS.AES.encrypt(data.toString(), "My approval key");
                    var encryptedAES1 = CryptoJS.AES.encrypt("approve", "My approval key");
                    var encryptedAES2 = CryptoJS.AES.encrypt("reject", "My approval key");
                    return '<button onclick="processApproval(\'' + encryptedAES + '\',\'' + encryptedAES1 + '\')" type="button" class="btn btn-success">Approve</button>' +
                        '<button onclick="processApproval(\'' + encryptedAES + '\',\'' + encryptedAES2 + '\')" type="button" class="btn btn-warning">Reject</button>';
                }
                return '';
            }
        },
    ],
    "columns": [
        { title: 'Project Name', data: 'projectname' },
        { title: 'Forward', data: 'id' },
        { title: 'Backward', data: 'id' },
        { title: 'Approve/Reject', data: 'id' },
        { title: 'Status', data: 'status' },
        { title: 'Current Stage', data: 'currentStage' }
    ],
});


function processRequest(id, action) {
    $(".jsondatanoc2").attr("value", id.toString());
    $(".tblname").attr("value", action.toString());
    $("#requestForm").submit();
}

function processApproval(id, action) {
    $(".jsondatanoc2").attr("value", id.toString());
    $(".tblname").attr("value", action.toString());
    $("#approvalForm").submit();
}


<form id="requestForm" th:action="@{/forward/{token}(token=${_csrf.token})}" method="POST">
    <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}" />
    <input class="jsondatanoc2" type="hidden" name="jsondatanoc2" value=""/>
    <input type="hidden" class="tblname" name="tblname"/>
</form>

<form id="approvalForm" th:action="@{/approveReject/{token}(token=${_csrf.token})}" method="POST">
    <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}" />
    <input class="jsondatanoc2" type="hidden" name="jsondatanoc2" value=""/>
    <input type="hidden" class="tblname" name="tblname"/>
</form>
