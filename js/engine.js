(function(){
    // Variable decclaration area
    var selectedCity = "";
    var selectedTown = "";
    var selectedMode = "SELL"; //Default value is sell
    var selectedSearchTerm = "";
    var selectedOffset = 0;
    var sideNavInitialized = false;
    var isCallbackInProgress = false;
    var filterMaxRange = 0;
    var filterPropertyCommercial = [];
    var filterPropertyResidential = [];
    // filters from filter sections
    var selectedRescom = "";
    var selectedPropType = "";
    var selectedSortType = "";
    var selectedMinPrice = "";
    var selectedMaxPrice = "";
    function resetFilters() {
        selectedRescom = "";
        selectedPropType = "";
        selectedSortType = "";
        selectedMinPrice = "";
        selectedMaxPrice = "";
        $("#residentialPropertyType").find("option:first").prop("selected",true).end().material_select();
        $("#commercialPropertyType").find("option:first").prop("selected",true).end().material_select();
        $("#propertyCat").find("option:first").prop("selected",true).end().material_select();
        $("#minprice,#maxprice,#propertySearchContainer").val("");        
    }
    function refreshAgentList(){
        if (isCallbackInProgress) {
            return;
        };
        isCallbackInProgress = true;
        $(".agentListView .progress").show();
        var query = {"city":selectedCity,"town":selectedTown,"offset":selectedOffset};
        if (selectedSearchTerm !== "") {
            query.search = selectedSearchTerm;
        };
        // Get all agents by default
        $.ajax({
            url:"/api/agentlist.php",
            method:"get",
            data:query,
            success:function(data){
                if (data.length === 0) {
                    return
                };
                if (data[0].agentlist.length <= 0 && selectedOffset !== 0) {
                    $(".agentListView .progress").hide();
                    return;
                }
                $(".agentSearchCount").text(data[0].agentcount+" Agents");
                var agentListTmpl = $('#agentListTmpl').html();
                var rendered = "";
                Mustache.parse(agentListTmpl);
                rendered = Mustache.render(agentListTmpl, {data: data[0].agentlist,firstCharacter:function(){
                    return this.bname[0];
                }});
                if (selectedOffset === 0) {
                    $('.agentSearchResult ul.collection').empty().html(rendered);
                }else{
                    $('.agentSearchResult ul.collection').append(rendered);
                }
                $('.agentSearchResult ul.collection li:even').addClass("alternate");
            },
            complete:function(){
                isCallbackInProgress = false;
                setDropDownValue();
                $(".agentListView .progress").hide();
                $(window).off("scroll").on("scroll",function(){
                    var currentScroll = $(window).scrollTop();
                    if  ($(window).scrollTop() == $(document).height() - $(window).height()){
                        selectedOffset = $(".collection-item").length;
                        refreshAgentList();
                        $(window).scrollTop(currentScroll);
                        return;
                    }
                });
            }
        });
    }
    function refreshPropertyList(mode){
        var filtersApplied = [];
        if (isCallbackInProgress) {
            return;
        };
        isCallbackInProgress = true;
        $(".appliedFilter").empty();
        $(".propertyListView ul.collection").removeClass("filteredResults");
        $(".propertyListView .progress").show();
        var query = {"city":selectedCity,"town":selectedTown,"sellrent":(mode) ? mode : selectedMode,"offset":selectedOffset};
        if (!mode) {
            // Double check if rent was selected 
            if($(".triggerRent").hasClass("active")){
                query.sellrent = "rent"      
            }
        };
        if (selectedSearchTerm !== "") {
            query.search = selectedSearchTerm;
        };
        if (selectedRescom !== "") {
            query.rescom = selectedRescom;
            filtersApplied.push(selectedRescom);
        };
        if (selectedPropType !== "") {
            query.type = selectedPropType;
            filtersApplied.push(selectedPropType);
        };
        if (selectedSortType !== "") {
            query.sort = selectedSortType;
        };
        if (selectedMinPrice !== "") {
            query.costmin = selectedMinPrice;
            filtersApplied.push("min price:"+selectedMinPrice);
        };
        if (selectedMaxPrice !== "") {
            query.costmax = selectedMaxPrice;
            filtersApplied.push("max price:"+selectedMaxPrice);
        };
        if (filtersApplied.length > 0) {
            $(".appliedFilter").text("You are looking for: "+filtersApplied.join(", ")).append("<a href='#' class='resetAppliedFilter'> - Clear Filter</a>");
            $(".appliedFilter").show();
            $(".propertyListView ul.collection").addClass("filteredResults");
        };
        // Get all agents by default
        $.ajax({
            url:"/api/propertylist.php",
            method:"get",
            data:query,
            success:function(data){
                var propertyListTmpl = $('#propertyListTmpl').html();
                if (data.length === 0) {
                    var rendered = Mustache.render(propertyListTmpl, {data: []});
                    if (selectedOffset === 0) {
                        $('.propertySearchResult ul.collection,.agentProperties ul.collection').empty().html(rendered);
                    }else{
                        if($('.propertySearchResult ul.collection,.agentProperties ul.collection').find("li").length <= 0){
                            $('.propertySearchResult ul.collection,.agentProperties ul.collection').append(rendered);
                        }
                    }
                    return
                };
                var propertycount = (data[0].propertycount) ? data[0].propertycount : 0;
                $(".propertySearchCount").text(propertycount+" properties");
                // check and load filter fields
                if ($("#residentialPropertyType").find("option").length === 1) {
                    var residentialPropertyTmpl = $("#residentialpropertytypes").html();
                    var rendered = Mustache.render(residentialPropertyTmpl, {data: filterPropertyResidential});
                    $("#residentialPropertyType").append(rendered).material_select();
                };
                if ($("#commercialPropertyType").find("option").length === 1) {
                    var commercialPropertyTmpl = $("#commercialpropertytypes").html();
                    var rendered = Mustache.render(commercialPropertyTmpl, {data: filterPropertyCommercial});
                    $("#commercialPropertyType").append(rendered).material_select();
                };
                $("#propertyCat").material_select();
                $("#sortingType").material_select();
                // 
                var rendered = Mustache.render(propertyListTmpl, {data: data[0].propertylist,propertyMessage:function(){
                    var message = encodeURIComponent("Available for sale at "+this.Cost+": "+this.Type+" | "+this.Locality+" | "+this.Area+" | "+this.Floor+", "+this.Address+", "+this.Rescom+" | "+this.Brokerage+". Contact "+this.agentinfo.bname+":"+this.agentinfo.phoneno+". Sent via miraroadagents.com");
                    return message;
                }});
                if (mode || $(".triggerRent").hasClass("active")) {
                    propertyListTmpl = $("#propertyRentListTmpl").html();
                    var rendered = Mustache.render(propertyListTmpl, {data: data[0].propertylist,propertyMessage:function(){
                    var message = encodeURIComponent("Available for rent of "+this.Rent+" / "+this.Deposite+": "+this.Type+" | "+this.Locality+" | "+this.Area+" | "+this.Floor+", "+this.Address+", "+this.Rescom+" | "+this.Brokerage+". Contact "+this.agentinfo.bname+":"+this.agentinfo.phoneno+". Sent via miraroadagents.com");
                    return message;
                }});
                };
                if (selectedOffset === 0) {
                    $('.propertySearchResult ul.collection,.agentProperties ul.collection').empty().html(rendered);
                }else{
                    $('.propertySearchResult ul.collection,.agentProperties ul.collection').append(rendered);
                }
                $('.propertySearchResult ul.collection li:even,.agentProperties ul.collection li:even').addClass("alternate");
            },
            complete:function(){
                isCallbackInProgress = false;
                setDropDownValue();
                $(".propertyListView .progress").hide();
                if (mode) {
                    $(window).off("scroll").on("scroll",function(){
                        if  ($(window).scrollTop() == $(document).height() - $(window).height()){
                            selectedOffset = $(".collection-item").length;
                            refreshPropertyList("rent");
                        }
                    });
                }else{
                    $(window).off("scroll").on("scroll",function(){
                        if  ($(window).scrollTop() == $(document).height() - $(window).height()){
                            selectedOffset = $(".collection-item").length;
                            refreshPropertyList();
                        }
                    });
                }
            }
        });
    }
    function refreshView(){
        $(".showAgentList,.showPropertyList").hide();
        if ($(".agentListView").is(":visible")) {
            refreshAgentList();
            $(".showPropertyList").show();
            
        }
        else if ($(".propertyListView").is(":visible")) {
            refreshPropertyList();
            $(".showAgentList").show();
        }
        else{
            $(".showAgentList,.showPropertyList").show();
        }
    }
    function getQueryVariable(variable){
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
        }
        return(false);
    }
    function refreshAgentInfo(data,mode){
        // uunbind lazy load on scroll functionality
        $(window).off("scroll");
        $(".module:not(.agentInfo)").hide();
        $(".agentInfo").fadeIn("fast");
        // Render the template
        var agentInfoTmpl = $('#agentInfoTmpl').html();
        if (mode) {
            var agentInfoTmpl = $('#agentRentInfoTmpl').html();
        };
        Mustache.parse(agentInfoTmpl);
        var rendered = Mustache.render(agentInfoTmpl, {data:data[0],firstCharacter:function(){
            return this.bname[0];
        },message:function(){
            var message = encodeURIComponent("See properties with "+this.bname+" at http://omestateconsultancy.com/anirudh_prabhu/index.html?uid="+this.uid);
            return message;
        },propertyMessage:function(){
            var message = encodeURIComponent("Available for sale for "+this.Cost+": "+this.Type+" | "+this.Locality+" | "+this.Area+" | "+this.Floor+", "+this.Address+", "+this.Rescom+" | "+this.Brokerage+". Contact "+this.agentInfo.bname+": "+this.agentInfo.phoneno+". Sent via miraroadagents.com");
            return message;
        },rentMessage:function(){
            var message = encodeURIComponent("Available for rent of "+this.Rent+" / "+this.Deposite+": "+this.Type+" | "+this.Locality+" | "+this.Area+" | "+this.Floor+", "+this.Address+", "+this.Rescom+" | "+this.Brokerage+". Contact: "+this.agentInfo.bname+":"+this.agentInfo.phoneno+". Sent via miraroadagents.com");
            return message;
        }});
        $('.agentInfo').empty().html(rendered);
        $('.agentInfo').find("li:even").addClass("alternate");
        if (!sideNavInitialized) {
            $(".button-collapse").sideNav({menuWidth: 300,edge:"left",closeOnClick:true});
            sideNavInitialized = true;
        };
        window.location.hash = "agentinfo";
    }
    // Event handlers
    $(document).on("click",".changeFilter",function(e){
        e.preventDefault();
        $(".filterArea").slideToggle();
        $(this).toggleClass("filterOpen");
    });
    $(document).on("click",".closeFilterDialog",function(e){
        e.preventDefault();
        $(".triggerFilter").trigger("click");
        refreshPropertyList();
    });
    $(document).on("click",".triggerFilter",function(e){
        e.preventDefault();
        $(".filterSection").slideToggle();
        $(this).toggleClass("triggerFilterOpen");
        if ($(".sortSection").is(":visible")) {
            $(".sortSection").slideToggle();
            $(this).toggleClass("triggerSortOpen");    
        };
    });
    $(document).on("click",".triggerSort",function(e){
        e.preventDefault();
        $(".sortSection").slideToggle();
        $(this).toggleClass("triggerSortOpen");
        if ($(".filterSection").is(":visible")) {
            $(".filterSection").slideToggle();
            $(this).toggleClass("triggerFilterOpen");
        };
    });
    $(document).on("click",".toggleAbbrevations",function(e){
        e.preventDefault();
        $(".abbrlist").slideToggle();
    });
    $(document).on("change","#sortingType",function(e){
        selectedSortType = $(this).find("option:selected").prop("value");
        $(".triggerSort").trigger("click");
        refreshPropertyList();
    });
	function initAgentTypingPlugin(){
        var self = this;
        $('#agentSearchContainer').off("keyup");
        $('#agentSearchContainer').typing({
            stop: function (event, $elem) {
                selectedSearchTerm = $elem.val();
                refreshAgentList();
            },
            delay: 400
        });    
    }
    function initPropertyTypingPlugin(){
        var self = this;
        $('#propertySearchContainer').off("keyup");
        $('#propertySearchContainer').typing({
            stop: function (event, $elem) {
                selectedSearchTerm = $elem.val();
                refreshPropertyList();
            },
            delay: 400
        });    
    }
    function initMinPriceTypingPlugin(){
        var self = this;
        $('#minprice').off("keyup");
        $('#minprice').typing({
            stop: function (event, $elem) {
                selectedMinPrice = $elem.val();
                if (isNaN(selectedMinPrice)) {
                    Materialize.toast('Please enter a number for minimum price.', 4000);
                    return false;
                };
                refreshPropertyList();
            },
            delay: 400
        });   
    }
    function initMaxPriceTypingPlugin(){
        var self = this;
        $('#maxprice').off("keyup");
        $('#maxprice').typing({
            stop: function (event, $elem) {
                selectedMaxPrice = $elem.val();
                if (isNaN(selectedMaxPrice)) {
                    Materialize.toast('Please enter a number for maximum price.', 4000);
                    return false;
                };
                refreshPropertyList();
            },
            delay: 400
        });   
    }
    // Make the call for city and town
    $.ajax({
        url:"/api/citytown.php",
        dataType:"json",
        success:function(data){
            var selectCity = data[0].city;
            $("span.selectedCity").text(selectCity);
            selectedCity = selectCity;
            // Render option tags
            var citytemplate = $('#optionCity').html();
            Mustache.parse(citytemplate);   // optional, speeds up future uses
            var rendered = Mustache.render(citytemplate, {data: data});
            $('.selectCity').html(rendered).material_select();
            // Fire ajax call for town details
            $.ajax({
                url:"/api/citytown.php?city="+selectedCity,
                dataType:"json",
                success: function(data){
                    selectTown = data[0].town;
                    $("span.selectedTown").text(selectTown);
                    selectedTown = selectTown;
                    var towntemplate = $('#optionTown').html();
                    Mustache.parse(towntemplate);   // optional, speeds up future uses
                    var rendered = Mustache.render(towntemplate, {data: data});
                    $('.selectTown').html(rendered).material_select();
                }
            })
        }
    });
    $.ajax({
        url:"/api/filter.php",
        dataType:"json",
        success:function(data){
            filterMaxRange = +data.maxcost;
            filterPropertyResidential = data.residentialtypes;
            filterPropertyCommercial = data.commercialtypes;
        }
    });
    $(document).on("change","select.selectTown",function(e){
        selectedOffset = 0;
        selectedSearchTerm = "";
        $(".filterArea").slideToggle();
        $(".changeFilter").toggleClass("filterOpen");
        $("span.selectedTown").text($(this).find("option:selected").attr("value"));
        selectedTown = $(this).find("option:selected").attr("value");
        selectedSearchTerm = "";
        refreshView();
        $('.button-collapse').sideNav('hide');
    });
    $(document).on("change","select.selectCity",function(e){
        selectedOffset = 0;
        selectedSearchTerm = "";
        $("span.selectedCity").text($(this).find("option:selected").attr("value"));
        selectedCity = $(this).find("option:selected").attr("value");
        selectedSearchTerm = "";
        $('.button-collapse').sideNav('hide');
        $.ajax({
            url:"/api/citytown.php?city="+selectedCity,
            dataType:"json",
            success: function(data){
                selectTown = data[0].town;
                $("span.selectedTown").text(selectTown);
                selectedTown = selectTown;
                var towntemplate = $('#optionTown').html();
                Mustache.parse(towntemplate);   // optional, speeds up future uses
                var rendered = Mustache.render(towntemplate, {data: data});
                $('select.selectTown').empty().html(rendered).material_select();
            },
            complete:function(){
                refreshView();
            }
        });
    });
    $(document).on("click",".showAgentList",function(e){
        e.preventDefault();
        window.location.hash = "agentlist";
    });
    $(document).on("click",".showPropertyList",function(e){
        e.preventDefault();
        window.location.hash = "propertylist"
    });
    $(document).on("click",".triggerSell",function(e){
        e.preventDefault();
        selectedOffset = 0;
        $(window).scrollTop(0);
        $(".triggerRent").removeClass("active");
        $(this).addClass("active");
        refreshPropertyList();
    });
    $(document).on("click",".triggerAgentSell",function(e){
        e.preventDefault();
        selectedOffset = 0;
        $(window).scrollTop(0);
        var agentEmail = $(this).attr("email");
        $.ajax({
            url:"/api/agentinfo.php",
            method:"get",
            data:{"email":agentEmail,"sellrent":"sell"},
            success:function(data){
                refreshAgentInfo(data);
                $(".triggerAgentSell").addClass("active");
            }
        });
    });
    $(document).on("change","#propertyCat",function(e){
        $(".resproptypedd,.commprotypedd").hide();
        var typeSelected = $(this).find("option:selected").prop("value");
        if (typeSelected === "residential") {
            $(".resproptypedd").fadeIn("fast");
        }
        else if (typeSelected === "commercial") {
            $(".commprotypedd").fadeIn("fast");
        }
        else{
            $(".resproptypedd").fadeIn("fast");   
        }
        selectedRescom = typeSelected;
        if (selectedRescom === "") {
            selectedPropType = "";
        };
        refreshPropertyList();
    });
    $(document).on("change","#residentialPropertyType,#commercialPropertyType",function(e){
        selectedPropType = $(this).find("option:selected").prop("value");
        refreshPropertyList();
    });
    $(document).on("click",".triggerRent",function(e){
        e.preventDefault();
        selectedOffset = 0;
        $(window).scrollTop(0);
        refreshPropertyList("rent");
        $(".triggerSell").removeClass("active");
        $(this).addClass("active");
    });
    $(document).on("click",".triggerAgentRent",function(e){
       e.preventDefault();
       selectedOffset = 0;
       $(window).scrollTop(0);
        var agentEmail = $(this).attr("email");
        $.ajax({
            url:"/api/agentinfo.php",
            method:"get",
            data:{"email":agentEmail,"sellrent":"rent"},
            success:function(data){
                refreshAgentInfo(data,"rent");
                $(".triggerAgentRent").addClass("active");
            }
        }); 
    });
    $(document).on("click",".propertySearchResult .collection-item",function(e){
        var $infoElement = $(this).next(".tabBody");
        $infoElement.slideToggle();
    });
    $(document).on("click",".agentSearchResult .collection-item",function(e){
        var agentEmail = $(this).attr("agentEmail");
        $.ajax({
            url:"/api/agentinfo.php",
            method:"get",
            data:{"email":agentEmail,"sellrent":selectedMode},
            success:function(data){
                refreshAgentInfo(data);
                $(".triggerAgentSell").addClass("active");
            }
        });
    });
    // check if URL has email parameter in it. If so load the agent info view
    if (getQueryVariable("uid")) {
        var agentUID = $.trim(getQueryVariable("uid"));
        $.ajax({
            url:"/api/agentinfo.php",
            method:"get",
            data:{"uid":agentUID,"sellrent":selectedMode},
            success:function(data){
                $(".listView").show();
                refreshAgentInfo(data);
            }
        });
    };
    $(document).on("click",function(e){
        if (e.target.classList.contains("filterSection") || e.target.classList.contains("sortSection") || e.target.classList.contains("filterArea")) {
            return false;
        };
        if (e.target.classList.contains("material-icons")) {
            if (e.target.parentNode.classList.contains("triggerFilter") || e.target.parentNode.classList.contains("triggerSort") || e.target.parentNode.classList.contains("changeFilter")) {
                return false;
            };
        };
        if (e.target.classList.contains("triggerFilter") || e.target.classList.contains("triggerSort") || e.target.classList.contains("changeFilter")) {
            return false;
        };
        if($(".filterSection").find(e.target).length > 0 || $(".sortSection").find(e.target).length > 0 || $(".filterArea").find(e.target).length > 0){
            return false;
        };
        // Close the filter section
        $(".filterSection").slideUp("fast");
        $(".triggerFilter").removeClass("triggerFilterOpen");
        // Close the sort section
        $(".sortSection").slideUp("fast");
        $(".triggerSort").removeClass("triggerSortOpen");
        // Close the location selector area
        $(".filterArea").slideUp("fast");
        $(".changeFilter").removeClass("filterOpen");
    });
    $(document).on("click",".resetAppliedFilter",function(e){
        e.preventDefault();
        resetFilters();
        refreshPropertyList();
    });
    $(document).on("click",".closePopUp",function(e){
        e.preventDefault();
        $('#addPropertyModal').closeModal();
    });
    function setDropDownValue(){
        if (selectedCity === "") {
            return;
        };
        // Set dropdown values
        $('select.selectCity').val(selectedCity).material_select();
        $('select.selectTown').val(selectedTown);
    }
    // Capture windows hash change events.
    window.onhashchange = function(){
        var currrentHash = window.location.hash;
        resetFilters();
        $('.modal-trigger').off().leanModal();
        if (currrentHash === "#agentlist") {
            selectedOffset = 0;
            selectedSearchTerm = "";
            $(window).scrollTop(0);
            $(".module:not(.agentListView)").hide();
            $(".listView").show();
            $(".agentListView").fadeIn("fast");
            if (!sideNavInitialized) {
                $(".button-collapse").sideNav({menuWidth: 300,edge:"left",closeOnClick:true});
                $("#slide-out").show();
                sideNavInitialized = true;
            }else{
                $("#slide-out").show();
            }
            refreshView();
            $('.button-collapse').sideNav('hide');
            initAgentTypingPlugin();    
            $("a.button-collapse.hide-on-large-only").show();
            return;
        }
        else if (currrentHash === "#propertylist") {
            selectedOffset = 0;
            selectedSearchTerm = "";
            $(window).scrollTop(0);
            $(".module:not(.propertyListView)").hide();
            $(".listView").show();
            $(".propertyListView").fadeIn("fast");
            if (!sideNavInitialized) {
                $(".button-collapse").sideNav({menuWidth: 300,edge:"left",closeOnClick:true});
                $("#slide-out").show();
                sideNavInitialized = true;
            }else{
                $("#slide-out").show();
            }
            refreshView();
            $('.button-collapse').sideNav('hide');
            initPropertyTypingPlugin();
            initMinPriceTypingPlugin();
            initMaxPriceTypingPlugin();
            $(".triggerSell").addClass("active");
            $("a.button-collapse.hide-on-large-only").show();
            return
        }
        else if (currrentHash === "#agentinfo") {
            $("#slide-out").show();
            $(".showAgentList").show();
            $(window).scrollTop(0);
            $("a.button-collapse.hide-on-large-only").show();
            return;
        }
        else{
            selectedOffset = 0;
            selectedSearchTerm = "";
            $(window).scrollTop(0);
            $(".module:not(.landingPage)").hide();
            $(".landingPage").show();
            $(".showAgentList,.showPropertyList").show();
            // Hide sidenav on landing page
            $("#slide-out").hide();
            $("a.button-collapse.hide-on-large-only").hide();
        }
    }
    window.location = window.location + "#";
    window.location.hash = "";
    $('.modal-trigger').off().leanModal();
})()