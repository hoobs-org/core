$(function(){
	let networks = undefined;

	function showHideEnterpriseSettings() {
		const security = $(this).find(":selected").attr("data-security");

		if(security === "enterprise") {
			$("#identity-group").show();
		} else {
			$("#identity-group").hide();
		}
	}

	$("#ssid-select").change(showHideEnterpriseSettings);

	$.get("/networks", (data) => {
		if(data.length === 0){
			$(".before-submit").hide();
			$("#no-networks-message").removeClass("hidden");
		} else {
			networks = JSON.parse(data);

			$.each(networks, (index, value) => {
				$("#ssid-select").append(
					$("<option>").text(value.ssid).attr("val", value.ssid).attr("data-security", value.security)
				);
			});

			jQuery.proxy(showHideEnterpriseSettings, $("#ssid-select"))();
		}
	});

	$("#connect-form").submit((event) => {
		event.preventDefault();

		$.post("/connect", $("#connect-form").serialize(), () => {
			$(".before-submit").hide();
			$("#submit-message").removeClass("hidden");
		});
	});
});
