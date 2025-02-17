@Controller
public class NavigationController {

    @Autowired
    private DistrictService districtService; // Service to fetch districts

    @GetMapping("/navigation")
    public String getNavigationPage(Model model) {
        List<District> districts = districtService.getAllDistricts();
        model.addAttribute("districts", districts);
        return "Navigation"; // This loads Navigation.html
    }
}
