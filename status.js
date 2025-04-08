ALTER TABLE dprprojects_mppwd ADD COLUMN status VARCHAR(20) DEFAULT 'Pending';


@Entity
public class DprProject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String approvaltype;
    private String status; // NEW FIELD

    // Getters and Setters
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}


@PostMapping("/forward/{token}")
public String forward(DprProject dprProject, Model model, @PathVariable("token") String token,
                      @RequestParam("jsondatanoc2") String jsondatanoc2, @RequestParam("tblname") String tblname,
                      BindingResult result, HttpSession session) {

    if (Objects.nonNull(session.getAttribute("isloginsso"))) {
        String decryptedId = getDecryptedValue(jsondatanoc2);
        Integer id = Integer.parseInt(decryptedId);

        String type = getDecryptedValue(tblname);
        Optional<DprProject> dprProject1 = dprRepo.findById(id);

        if (dprProject1.isPresent()) {
            DprProject project = dprProject1.get();
            String approvalType = project.getApprovaltype();

            if (type.equalsIgnoreCase("forward")) {
                if (approvalType.equalsIgnoreCase("DIST")) {
                    project.setApprovaltype("CIRCLE");
                    project.setStatus("Pending"); // Set status to Pending
                } else if (approvalType.equalsIgnoreCase("CIRCLE")) {
                    project.setApprovaltype("ZONE");
                    project.setStatus("Pending");
                } else if (approvalType.equalsIgnoreCase("ZONE")) {
                    project.setStatus("Approved"); // Final Approval
                }
            } else { // Backward Case
                if (approvalType.equalsIgnoreCase("ZONE")) {
                    project.setApprovaltype("CIRCLE");
                    project.setStatus("Pending");
                } else if (approvalType.equalsIgnoreCase("CIRCLE")) {
                    project.setApprovaltype("DIST");
                    project.setStatus("Pending");
                } else {
                    project.setStatus("Rejected"); // If rejected at the district level
                }
            }

            dprRepo.save(project);
        }
        return "redirect:/dprsummaryreport";
    }
    return null;
}


$('#notificationtableuser').DataTable({
    dom : 'Bfrtip',
    buttons : [ 'csv' ],
    data : data,
    "columns": [
        { title: 'Project Name', data: 'projectname' },
        { title: 'Forward', data: 'id' },
        { title: 'Backward', data: 'id' },
        { title: 'Status', data: 'status' } // New Status Column
    ]
});


model.addAttribute("data", queryForList);
model.addAttribute("status", queryForList.stream().map(m -> m.get("status")).collect(Collectors.toList()));
