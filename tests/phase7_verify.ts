import {
  WHATSAPP_DEFAULT_PHONE,
  WHATSAPP_TEMPLATE_DEFAULTS,
  DEFAULT_SERVICE_SLUG_TO_KEY,
  INITIAL_WHATSAPP_TEMPLATES,
  buildServiceWhatsAppMessage,
  buildServiceWhatsAppUrl,
  getServiceTemplateKey,
  interpolate,
} from "@/lib/whatsapp-templates";

async function runPhase7Tests() {
  console.log("================================================================================");
  console.log("MASAAR HOLIDAYS - PHASE 7 TEST VERIFICATION SUITE");
  console.log("WhatsApp Templates for Additional Services & Website CTA Integration");
  console.log("================================================================================\n");

  let allPassed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      allPassed = false;
    }
  }

  // -----------------------------------------------------------------------------
  // TEST 1: Template 1 - Umrah Guide Enquiry
  // -----------------------------------------------------------------------------
  console.log("Test 1: Umrah Guide enquiry template");
  const rawUmrahGuide = WHATSAPP_TEMPLATE_DEFAULTS.umrahGuideEnquiry;
  assert(rawUmrahGuide.includes("I would like to enquire about arranging an Umrah Guide"), "Contains correct header");
  assert(rawUmrahGuide.includes("Number of pilgrims:"), "Contains Number of pilgrims field");

  // Default fallback (no params)
  const defaultMsg1 = buildServiceWhatsAppMessage(rawUmrahGuide);
  assert(defaultMsg1.includes("Preferred city: Makkah / Madinah / Both"), "Defaults city to 'Makkah / Madinah / Both'");

  // Dynamic parameters
  const dynamicMsg1 = buildServiceWhatsAppMessage(rawUmrahGuide, {
    city: "Makkah Only",
    service_option: "Ihram & Tawaf Accompaniment",
    package_name: "Masaar Premium Umrah",
    service_url: "https://www.masaarholidays.com/additional-services/umrah-guide",
  });
  assert(dynamicMsg1.includes("Preferred city: Makkah Only"), "Dynamically populates selected city");
  assert(dynamicMsg1.includes("Service requirements: Ihram & Tawaf Accompaniment"), "Dynamically populates service requirements");
  assert(dynamicMsg1.includes("Package: Masaar Premium Umrah"), "Dynamically populates package origin");
  assert(dynamicMsg1.includes("Reference: https://www.masaarholidays.com/additional-services/umrah-guide"), "Dynamically populates service URL");

  // -----------------------------------------------------------------------------
  // TEST 2: Template 2 - Makkah Ziyarah Enquiry
  // -----------------------------------------------------------------------------
  console.log("\nTest 2: Makkah Ziyarah enquiry template");
  const rawMakkah = WHATSAPP_TEMPLATE_DEFAULTS.makkahZiyarahEnquiry;
  assert(rawMakkah.includes("I am interested in Makkah Ziyarah arrangements"), "Contains correct header");

  const defaultMsg2 = buildServiceWhatsAppMessage(rawMakkah);
  assert(defaultMsg2.includes("Preferred arrangement: Private / Group / Need guidance"), "Defaults arrangement to 'Private / Group / Need guidance'");

  const dynamicMsg2 = buildServiceWhatsAppMessage(rawMakkah, {
    service_option: "Private Arrangement (GMC Yukon XL)",
  });
  assert(dynamicMsg2.includes("Preferred arrangement: Private Arrangement (GMC Yukon XL)"), "Populates custom service option");

  // -----------------------------------------------------------------------------
  // TEST 3: Template 3 - Madinah Ziyarah Enquiry
  // -----------------------------------------------------------------------------
  console.log("\nTest 3: Madinah Ziyarah enquiry template");
  const rawMadinah = WHATSAPP_TEMPLATE_DEFAULTS.madinahZiyarahEnquiry;
  assert(rawMadinah.includes("I am interested in Madinah Ziyarah arrangements"), "Contains correct header");

  const dynamicMsg3 = buildServiceWhatsAppMessage(rawMadinah, {
    service_option: "Shared / Group Arrangement",
  });
  assert(dynamicMsg3.includes("Preferred arrangement: Shared / Group Arrangement"), "Populates group arrangement");

  // -----------------------------------------------------------------------------
  // TEST 4: Template 4 - Private Tours Enquiry
  // -----------------------------------------------------------------------------
  console.log("\nTest 4: Private Tours enquiry template");
  const rawTours = WHATSAPP_TEMPLATE_DEFAULTS.privateToursEnquiry;
  assert(rawTours.includes("I would like to enquire about a private tour"), "Contains correct header");

  const dynamicMsg4 = buildServiceWhatsAppMessage(rawTours, {
    city: "Taif & Badr Historical Tour",
    duration: "Full Day (8 Hours)",
  });
  assert(dynamicMsg4.includes("Preferred destination: Taif & Badr Historical Tour"), "Populates destination city");
  assert(dynamicMsg4.includes("Preferred duration: Full Day (8 Hours)"), "Populates tour duration");

  // -----------------------------------------------------------------------------
  // TEST 5: Template 5 - Wheelchair Assistance Enquiry
  // -----------------------------------------------------------------------------
  console.log("\nTest 5: Wheelchair Assistance enquiry template");
  const rawWheelchair = WHATSAPP_TEMPLATE_DEFAULTS.wheelchairAssistanceEnquiry;
  assert(rawWheelchair.includes("enquire about wheelchair assistance during my pilgrimage"), "Contains correct header");

  const dynamicMsg5 = buildServiceWhatsAppMessage(rawWheelchair, {
    city: "Makkah Only",
    service_option: "Tawaf and Sa'i assistance with licensed pusher",
  });
  assert(dynamicMsg5.includes("City required: Makkah Only"), "Populates city required");
  assert(dynamicMsg5.includes("Type of assistance required: Tawaf and Sa'i assistance"), "Populates assistance type");

  // -----------------------------------------------------------------------------
  // TEST 6: Template 6 - Private Transport Enquiry
  // -----------------------------------------------------------------------------
  console.log("\nTest 6: Private Transport enquiry template");
  const rawTransport = WHATSAPP_TEMPLATE_DEFAULTS.privateTransportEnquiry;
  assert(rawTransport.includes("I would like to enquire about private transportation"), "Contains correct header");

  const dynamicMsg6 = buildServiceWhatsAppMessage(rawTransport, {
    city: "Jeddah Airport to Makkah Hotel",
    service_option: "Mercedes V-Class Luxury Van",
  });
  assert(dynamicMsg6.includes("Destination: Jeddah Airport to Makkah Hotel"), "Populates destination");
  assert(dynamicMsg6.includes("Vehicle preference: Mercedes V-Class Luxury Van"), "Populates vehicle preference");

  // -----------------------------------------------------------------------------
  // TEST 7: Template 7 - General Additional Services Enquiry
  // -----------------------------------------------------------------------------
  console.log("\nTest 7: General Additional Services enquiry template");
  const rawGeneral = WHATSAPP_TEMPLATE_DEFAULTS.additionalServicesGeneral;
  assert(rawGeneral.includes("enquire about additional services for my Umrah journey"), "Contains correct header");

  const dynamicMsg7 = buildServiceWhatsAppMessage(rawGeneral, {
    service_name: "VIP Airport Meet & Assist",
  });
  assert(dynamicMsg7.includes("Services interested in: VIP Airport Meet & Assist"), "Populates service name");

  // -----------------------------------------------------------------------------
  // TEST 8: URL Generation & Encoding Integrity
  // -----------------------------------------------------------------------------
  console.log("\nTest 8: URL generation, phone number & encoding integrity");
  const generatedUrl = buildServiceWhatsAppUrl("umrah-guide", {
    service_name: "Umrah Guide",
    service_url: "https://www.masaarholidays.com/additional-services/umrah-guide",
  });

  assert(generatedUrl.startsWith(`https://wa.me/${WHATSAPP_DEFAULT_PHONE}?text=`), `Target phone number is confirmed: ${WHATSAPP_DEFAULT_PHONE}`);
  assert(!generatedUrl.includes(" "), "URL contains no unescaped spaces");
  assert(generatedUrl.includes("Assalamu%20Alaikum"), "Encodes Arabic greeting cleanly");

  // Verify decoded URL content
  const parsedUrl = new URL(generatedUrl);
  const textParam = parsedUrl.searchParams.get("text");
  assert(!!textParam && textParam.includes("I would like to enquire about arranging an Umrah Guide."), "Decoded message matches approved text verbatim");

  // -----------------------------------------------------------------------------
  // TEST 9: Service Slug to Template Resolution
  // -----------------------------------------------------------------------------
  console.log("\nTest 9: Service slug to template resolution");
  assert(getServiceTemplateKey("umrah-guide") === "umrahGuideEnquiry", "Resolves 'umrah-guide' -> umrahGuideEnquiry");
  assert(getServiceTemplateKey("makkah-ziyarah") === "makkahZiyarahEnquiry", "Resolves 'makkah-ziyarah' -> makkahZiyarahEnquiry");
  assert(getServiceTemplateKey("madinah-ziyarah") === "madinahZiyarahEnquiry", "Resolves 'madinah-ziyarah' -> madinahZiyarahEnquiry");
  assert(getServiceTemplateKey("private-tours") === "privateToursEnquiry", "Resolves 'private-tours' -> privateToursEnquiry");
  assert(getServiceTemplateKey("wheelchair-assistance") === "wheelchairAssistanceEnquiry", "Resolves 'wheelchair-assistance' -> wheelchairAssistanceEnquiry");
  assert(getServiceTemplateKey("private-transport") === "privateTransportEnquiry", "Resolves 'private-transport' -> privateTransportEnquiry");
  assert(getServiceTemplateKey("unknown-service") === "additionalServicesGeneral", "Resolves unknown slug -> additionalServicesGeneral");

  // -----------------------------------------------------------------------------
  // TEST 10: Existing Package Templates Regression Check
  // -----------------------------------------------------------------------------
  console.log("\nTest 10: Existing package WhatsApp templates regression check");
  const pkgMsg = interpolate(WHATSAPP_TEMPLATE_DEFAULTS.packageEnquiry, {
    packageTitle: "Masaar Premium Umrah",
    tier: "5-Star",
    duration: "7 Nights",
  });
  assert(pkgMsg.includes("Masaar Premium Umrah (5-Star — 7 Nights)"), "Existing packageEnquiry template works without regression");

  const hotelMsg = interpolate(WHATSAPP_TEMPLATE_DEFAULTS.hotel, {
    hotelName: "Swissôtel Al Maqam",
  });
  assert(hotelMsg.includes("Swissôtel Al Maqam"), "Existing hotel template works without regression");

  const initialTmplCount = INITIAL_WHATSAPP_TEMPLATES.length;
  assert(initialTmplCount >= 14, `Initial complete template list contains all templates (Total: ${initialTmplCount})`);

  console.log("\n================================================================================");
  if (allPassed) {
    console.log("ALL 10 PHASE 7 TEST VERIFICATIONS PASSED WITH 100% SUCCESS!");
  } else {
    console.log("SOME TESTS FAILED — CHECK LOGS ABOVE");
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runPhase7Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

