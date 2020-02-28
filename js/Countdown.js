//****************************************倒计时 begin********************************************/

+function ($) {
    var Countdown = function (obj, options) {
        this.Btn = $(obj);
        this.CountTime = options.CountTime;
        this.DefaultValue = options.DefaultValue;
        this.DisabledClass = options.DisabledClass;
        this.index = 0;
        this.timer = null;
        this.Isbegin = false;
        this.IsInput=false;
        this.Action = options.Action;
        this.BeforeSend = options.BeforeSend;
    }
    Countdown.default = {
        CountTime: 10,
        DefaultValue: "获取验证码",
        DisabledClass: "disabled",
        BeforeSend: function () {
            console.log("BeforeSend执行了");
            return true;
        },
        Action: function () {
            console.log("Action执行了");
        }
    }
    Countdown.prototype.tagName=function(tagName){
           if(tagName=="INPUT"){
                this.IsInput=true;
           }
    }
    
    Countdown.prototype.SetValue=function(Value){
        if(this.IsInput){
             this.Btn.val(Value);
        }else{
            this.Btn.html(Value);
        }
    }
      
    
    Countdown.prototype.begin = function () {
        if (!this.Isbegin) {
            if (this.BeforeSend()) {
                var Nownum = parseInt(this.CountTime);
                var _this = this;
                this.Isbegin = true;
                this.Action();
                this.Btn.addClass(this.DisabledClass);
                this.SetValue("倒计时" + Nownum + "秒");
                this.timer = setInterval(function () {
                    Nownum--;
                    if (Nownum != 0) {
                       _this.SetValue("倒计时" + Nownum + "秒");
                    } else {
                        _this.end();
                    }
                }, 1000)
            }
        }
    }
    Countdown.prototype.end = function () {
        this.Isbegin = false;
        clearInterval(this.timer);
        this.Btn.removeClass(this.DisabledClass);
        this.SetValue(this.DefaultValue);
    }

    function Plugin(option) {
        var options = $.extend({}, Countdown.default, typeof option == 'object' && option);
        var countdown = new Countdown(this, options);
        this.click(function (e) {
            countdown.tagName(e.currentTarget.tagName); 
            countdown.begin();
        })
    }
    $.fn.Countdown = Plugin;
}(jQuery);

//****************************************倒计时 end********************************************/