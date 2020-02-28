mui.init();

/*
 *ajax 
 * url ：地址
 * data ：数据
 * callback ：成功回调
 * type 访问类型 默认 post
 * */

//本地测试
// const ip = "192.168.56.1";
// const api = ip + ":8005";
//线上测试
// const ip = "47.244.108.231";
// const api = ip + ":8005";
//正式环境
const ip = "pay.legendpay.vip";
const api = ip + "";

const imgsapi = "http://" + ip;
const appName = "传奇付";
var startCollectingFlag = 0; //首页开始收款状态值
var lockReconnect = false; //避免ws重复连接
var newLockReconnect = false; //避免重复连接
var wsUrl = "ws://" + api + "/websocket/" + mbId();
var ws;
var reLink;
var tmerError;
var reLinkNum = 0; //记录断网重连次数
var equipmentType = ''; //设备类型
var thisVersionNumber = ''; //当前版本号第一位
var thisVersionNumber_2 = ''; //获取当前完整版本号
var getVCodeNumber = '';
var placeSatus = getGetPlaceSatus();
if (placeSatus == "1") {
	getPlace();
}


function ajax(url, data, callback, type) {
	//  mui.alert("登录失败");
	mui.plusReady(function() {
		plus.nativeUI.showWaiting("加载中...");
		var authorization = localStorage.getItem("token");
		console.log(localStorage.getItem("token"));
		if (url.match("/newLogin") == null) {
			var authorization = localStorage.getItem("token");
			if (authorization == null || authorization == "undefined") {
				plus.nativeUI.closeWaiting();
				create_view("login", "login.html");
				localStorage.clear();
				return;
			}
		}

		console.log("authorization:" + authorization);
		console.log("请求URL：" + url);
		console.log("请求参数：" + JSON.stringify(data));
		console.log("请求方式：" + type);
		mui.ajax({
			url: "http://" + api + url,
			type: type || "POST",
			crossDomain: true, //强制使用5+跨域
			headers: {
				"Authorization": "Bearer " + authorization
			},
			data: data || {},
			dataType: "JSON",
			success: function(data) {
				plus.nativeUI.closeWaiting();
				// console.log("url:" + url + "服务端返回：" + data);
				// console.log("data数据是解析"+data.token);
				data = JSON.parse(data);
				if (data.code == 13) {
					out_login();
					return;
				}
				if (data.code == 11) {
					out_login();
					// mui.alert(data.message);
					mui.alert(data.message, ' ', '确定', function(e) {});
					return;
				}
				return callback(data);

			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				plus.nativeUI.closeWaiting();
				//异常处;
				// console.log(XMLHttpRequest.responseText);
				mui.alert("请求失败" + XMLHttpRequest.responseText);
				// console.log(textStatus);
				// console.log(errorThrown);

				if (plus.networkinfo.getCurrentType() == plus.networkinfo.CONNECTION_NONE) {
					mui.toast("网络异常，请检查网络设置！");
					if (app && app.startCollectingActive) {
						app.startCollecting = "开始收款";
						app.startCollectingActive = false;
					}
				}

				// mui.alert("发生错误：" + XMLHttpRequest.responseText, ' ', '确定', function(e) {
				// 	out_login();
				// }, 'div');
			}
		});
	});
};

/*--------------- 验证手机版本号	start --------------------------*/
/* 手机端判断各个平台浏览器及操作系统平台	start */
function checkPlatform() {
	var str = navigator.userAgent; //浏览器的user-agent信息
	console.log('navigator.userAgent----: ' + navigator.userAgent);

	if (/android/i.test(navigator.userAgent)) {
		console.log("This is Android'browser."); //这是Android平台下浏览器
		getAndroidVersion(str);
		$('#mobileModels').text('Android');
	}
	if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
		console.log("This is iOS'browser."); //这是iOS平台下浏览器
		getIPhoneVersion(str);
		$('#mobileModels').text('iOS');

	}
	if (/Linux/i.test(navigator.userAgent)) {
		console.log("This is Linux'browser."); //这是Linux平台下浏览器
		// $('#mobileModels').text('Linux/Android');
	}
	if (/Linux/i.test(navigator.platform)) {
		console.log("This is Linux operating system."); //这是Linux操作系统平台
	}
	if (/MicroMessenger/i.test(navigator.userAgent)) {
		console.log("This is MicroMessenger'browser."); //这是微信平台下浏览器
	}
};

$(document).ready(function() {
	// alert(navigator.platform);
	checkPlatform(); //调用验证手机版本号
});
/* 手机端判断各个平台浏览器及操作系统平台	end */


/* 验证当前版本号	start */
// 获取当前Android版本号
function getAndroidVersion(str) {
	var reg = RegExp(/Android/i);
	var thatVersion = str.match(reg);
	var AndroidLen = 'Android'.length;
	var len = AndroidLen + thatVersion.index;
	var getVCode = str.substring(len, len + 3); //版本号第一位
	thisVersionNumber_2 = parseFloat($.trim(str.substring(len, len + 4))); //完整版本号
	thisVersionNumber = (parseInt(getVCode)); //转换为数值,防止如果第一位版本数字为一位,过滤版本号首位数字得空格或小数点
	// console.log(thatVersion);
	// console.log(thisVersionNumber);
	// console.log(thisVersionNumber_2);
	verificVersion(thisVersionNumber); //调用
};


// 获取当前iPhone版本号
function getIPhoneVersion(str) {
	// js 判断字符串中是否包含某个字符串
	var reg = RegExp(/like Mac OS X/i); //iPhone特殊字符
	var reg2 = RegExp(/_/i); //截取版本后专有横杠
	var reg3 = RegExp(/_(\S*)_/); //"/S*表示多个字符串"

	// var str=navigator.userAgent;
	var thatVersion = str.match(reg2); //正则截取特定字符串
	var len = thatVersion.index; //截取到当前版本号最后一位数字(最大长度)
	var getVCode = str.substring(len - 2, len); //获取到当前版本号首位数字
	thisVersionNumber = parseInt(getVCode); //转换为数值,防止如果第一位版本数字为一位,过滤掉前面的空格
	thisVersionNumber_2 = parseFloat($.trim(str.substring(len - 2, len + 4))); //完整版本号

	// console.log(thatVersion);
	// console.log(thisVersionNumber);
	// console.log(thisVersionNumber_2);

	verificVersion(thisVersionNumber);
};
/* 验证当前版本号	end */


// 判断手机版本是否高于5
function verificVersion(thisVersionNumber) {
	if (thisVersionNumber_2 >= 5) {
		$('#infoWrap').hide();
		$('#wrap').show();
		// mui.toast('您的手机内核浏览器支持此应用',{duration:'short',type:'div'});
	} else {
		// $('.versionNumber').text(thisVersionNumber);
		$('.versionNumber').text(thisVersionNumber_2); //赋值版本号
		$('#wrap').hide();
		$('#infoWrap').show();
		mui.toast('您的手机内核浏览器过低不支持此应用,请您对内核浏览器进行更新升级', {
			duration: 'short',
			type: 'div'
		});
	}
};
/*--------------- 验证手机版本号	start --------------------------*/



function asyncAjax(url, data, callback, type) {
	mui.ajax({
		url: "http://" + api + url,
		type: type || "POST",
		crossDomain: true, //强制使用5+跨域
		data: data || {},
		dataType: "JSON",
		success: function(data) {
			if (data.code == 13) {
				out_login();
				return;
			}
			if (data.code == 11) {
				out_login();
				// mui.alert(data.message);
				mui.alert(data.message, ' ', '确定', function(e) {})
				return;
			}
			return callback(data);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			plus.nativeUI.closeWaiting();
			//异常处;
			console.log(XMLHttpRequest.responseText);
			// mui.alert("登录失败" + XMLHttpRequest.responseText);
			console.log(textStatus);
			console.log(errorThrown);
			mui.alert("发生错误：" + XMLHttpRequest.responseText, ' ', '确定', function(e) {
				out_login();
			}, 'div')
		}
	});
}

function postImg(data) {
	mui.ajax({
		url: "http://192.168.0.163:8005/member/file/upload",
	})
}
/*
 *验证文本框是否为空
 * */
function empty() {
	var flog = false;
	$("input").each(function() {
		if (!$(this).val()) {
			mui.toast($(this).attr("placeholder"));
			flog = true;
			return false;
		}
	})
	return flog;
}

/*
 * 验证两个字段是否一致
 * */
function ed(one, two) {
	if ($("." + two) !== $("." + one) && $("#" + two) !== $("#" + one)) {
		mui.toast("密码不一致");
		return false;
	} else {
		return true;
	}
}

/*
 * 打开新窗口
 * url：子页面地址
 * id：子页面标志
 * styles：页面属性  以{}形式 可写可不写
 * extras：自定义扩展 可传参  以{}形式 可写可不写
 * 	 */

var apiUrl = '';

function win_open(url, id, styles, extras) {
	mui.openWindow({
		url: url,
		id: id,
		styles: styles,
		extras: extras,
		createNew: false, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
		//	    show:{
		//	      autoShow:true,//页面loaded事件发生后自动显示，默认为true
		//	      aniShow:"slide-in-right",//页面显示动画，默认为”slide-in-right“；
		//	      duration:100//页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
		//	    },
		waiting: {
			autoShow: true, //自动显示等待框，默认为true
			title: '正在加载...', //等待对话框上显示的提示内容

		}
	})
}

function win_open_login(url, id, styles, extras) {
	mui.openWindow({
		url: url,
		id: id,
		styles: styles,
		extras: extras,
		createNew: false, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
		//	    show:{
		//	      autoShow:true,//页面loaded事件发生后自动显示，默认为true
		//	      aniShow:"slide-in-right",//页面显示动画，默认为”slide-in-right“；
		//	      duration:100//页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
		//	    },
		waiting: {
			autoShow: false, //自动显示等待框，默认为true
			title: '正在加载...', //等待对话框上显示的提示内容

		}
	})
}

/**
 * 创建窗口并打开
 * get_view_id：获取窗口id
 * url ：打开窗口地址
 * styles：窗口属性
 * @description
 * @constructor 创建窗口并打开
 */
function create_view(get_view_id, url, styles, extras) {
	mui.plusReady(function() {
		var curr = plus.webview.getWebviewById(get_view_id);
		if (!curr) {
			var view = plus.webview.create(url, get_view_id, styles, extras);
			plus.webview.show(get_view_id, "slide-in-right");
		} else {
			plus.webview.show(get_view_id, "slide-in-right");
		}
	})

}

function out_login() {
	if (ws) {
		ws.close();
	}
	if (mui.os.android) {

		//				plus.runtime.quit();//退出程序
		var curr = plus.webview.currentWebview();
		//获取所有已经打开的webview窗口
		var wvs = plus.webview.all();
		// console.log(wvs.length);
		for (var i = 0, len = wvs.length; i < len; i++) {
			//关闭除当前页面外的其他页面
			if (wvs[i].getURL() == curr.getURL())
				//遇到当前页跳过
				continue;
			//非当前页执行关闭
			plus.webview.close(wvs[i]);
		}
		//				console.log(JSON.stringify(curr));
		//打开login页面
		plus.webview.open('login.html');
		localStorage.clear();
		curr.close();
		//				console.log(JSON.stringify(curr));''

	} else if (mui.os.ios) {
		var curr = plus.webview.currentWebview();
		//获取所有已经打开的webview窗口
		var wvs = plus.webview.all();
		for (var i = 0, len = wvs.length; i < len; i++) {
			//关闭除当前页面外的其他页面
			if (wvs[i].getURL() == curr.getURL())
				//遇到当前页跳过
				continue;
			//非当前页执行关闭
			plus.webview.close(wvs[i]);
		}

		curr.close();
		//打开login页面
		plus.webview.open('login.html');

	}
}

/* 退出登录 关闭所有窗口 */
function close_view() {
	//返回登录点击事件
	var btnArray = ['是', '否'];
	mui.confirm('您是否确定退出?', '', btnArray, function(e) {
		console.log(e.index);
		//当选择是的时候执行
		mui.plusReady(function() {
			if (e.index == 0) {
				out_login();
			}
		})
	}, 'div')

}
//判断内容是否有空格
function javaTrim(str) {
	for (var i = 0;
		(str.charAt(i) == ' ') && i < str.length; i++);
	if (i == str.length) return ''; //whole string is space
	var newstr = str.substr(i);
	for (var i = newstr.length - 1; newstr.charAt(i) == ' ' && i >= 0; i--);
	newstr = newstr.substr(0, i + 1);
	return newstr;
}

function return_login() {
	//返回登录点击事件
	//判断当前设备类型
	if (mui.os.ios || mui.os.ipad || mui.os.android) {
		// 获取当前webview窗口对象
		var curr = plus.webview.currentWebview();
		//获取所有已经打开的webview窗口
		var wvs = plus.webview.all();
		for (var i = 0, len = wvs.length; i < len; i++) {
			//关闭除当前页面外的其他页面
			if (wvs[i].getURL() == curr.getURL())
				//遇到当前页跳过
				continue;
			//非当前页执行关闭
			plus.webview.close(wvs[i]);
		}
		//打开login页面
		plus.webview.open('login.html');

		//执行关闭当前页面
		curr.close();
	}
}


//回到顶部
function scrollUp() {
	if (mui.os.android) {
		window.scrollTo(0, 0);
	} else if (mui.os.ios) {
		//		mui('.mui-scroll-wrapper').scroll().scrollTo(0,0,66);//66毫秒滚动到顶
		window.scrollTo(0, 0);
	}
}

//参数copy是要复制的文本内容
function copy_fun(copy) {
	console.log(copy)
	mui.plusReady(function() {
		//判断是安卓还是ios
		if (mui.os.ios) {
			//ios
			var UIPasteboard = plus.ios.importClass("UIPasteboard");
			var generalPasteboard = UIPasteboard.generalPasteboard();
			//设置/获取文本内容:
			generalPasteboard.plusCallMethod({
				setValue: copy,
				forPasteboardType: "public.utf8-plain-text"
			});
			generalPasteboard.plusCallMethod({
				valueForPasteboardType: "public.utf8-plain-text"
			});
			mui.toast("已成功复制到剪贴板");
		} else {
			//安卓
			var context = plus.android.importClass("android.content.Context");
			var main = plus.android.runtimeMainActivity();
			var clip = main.getSystemService(context.CLIPBOARD_SERVICE);
			plus.android.invoke(clip, "setText", copy);
			mui.toast("已成功复制到剪贴板");
		}
	});
}

//首页返回键处理
//处理逻辑：1秒内，连续两次按返回键，则退出应用；
var first = null;
mui.plusReady(function() {
	plus.key.addEventListener('backbutton', function() {
		//首次按键，提示‘再按一次退出应用’
		if (!first) {
			first = new Date().getTime(); //该方法，苹果不兼容,应该用new Date(data.replace(/-/g,'/')).getTime()；做个注释
			mui.toast('再按一次退出应用');
			setTimeout(function() {
				first = null;
			}, 1000);
		} else {
			if (new Date().getTime() - first < 1000) {
				if (ws)
					ws.close();
				plus.runtime.quit();
			}
		}
	}, false);
});

/*
 * 获取表单数据
 * @param: selector 表单选择器
 * @return: 数据对象
 */
function getFormData(selector) {
	var $form = selector;
	var data = {};
	var checkList = {};

	$form.find('[name]').each(function() {
		var $this = $(this);
		var name = $this.attr('name');
		var type = $this.attr('type');
		var val = $this.val();
		var checked = $this.prop('checked') === true;

		// 仅针对有名字并且未获取到值的情况进行处理
		if (!!name && data[name] === undefined) {
			if (type === 'radio') { // 处理单选框
				if (checked) {
					data[name] = val;
				}
			} else if (type === 'checkbox') { // 处理复选框
				if (checked) {
					if (!checkList[name]) {
						checkList[name] = [];
					}
					checkList[name].push(val);
				}
			} else { // 其他情况直接取值
				data[name] = val;
			}
		}
	});

	// 针对复选框，有值的时候进行提取
	$.each(checkList, function(name, value) {
		if (value && value.length > 0) {
			data[name] = value;
		}
	});

	return data;
};
/*
 * 填充表单
 * @param: selector 表单选择器
 * @param: data {Objece} 数据对象
 * @return: 表单选择器对象
 */
function fillForm(selector, data) {
	var $form = selector;

	$.each(data, function(key, value) {
		var $elem = $form.find('[name="' + key + '"]');
		if ($elem.length > 0) {
			if ($elem.attr('type') === 'radio' && $elem.val() === value) {
				$elem.prop('checked', true);
			} else if ($elem.attr('type') === 'checkbox' && value == '1') {
				$elem.prop('checked', true);
			} else {
				$elem.val(value);
			}
		}
	});

	return $form;
};

/*
 * 重置表单
 * @param: selector jQuery选择器
 * @return: jQuery对象
 */
function resetForm(selector) {
	var $form = selector;
	$form.find('[name]').val('');

	var _reset = $form.filter('form')[0];
	// 确保执行重置方法的对象为一个form
	if (_reset) {
		_reset.reset();
	}

	return $form;
};
/*
 * 填充表单Html值
 * @param selector jQuery选择器
 * @param data {Object} 数据对象
 * @return: 无
 * 该方法针对形如`data-value="{name}"`形式的元素进行写HTML代码操作
 */
function formHtmlData(selector, data) {
	var $elem = selector;
	$elem.find('[data-value]').html('');
	$.each(data, function(key, value) {
		$elem.find('[data-value=' + key + ']').html(value);
	});
};

// 获取用户的ID
function mbId() {
	var mbId = localStorage.getItem("mbId");
	console.log("mbId:" + mbId);
	return mbId;
}
// 获取用户的用户名
function mbName() {
	var mbName = localStorage.getItem("mbName");
	console.log("mbName:" + mbName);
	return mbName;
}
// 获取用户的账号
function mbLinkman() {
	var mbLinkman = localStorage.getItem("mbLinkman");
	console.log("mbLinkman:" + mbLinkman);
	return mbLinkman;
}
// 获取用户的积分
function mbIntegral() {
	var mbIntegral = localStorage.getItem("mbIntegral");
	console.log("mbIntegral:" + mbIntegral);
	return mbIntegral;
}

// 获取用户的冻结积分
function freezeIntegral() {
	var freezeIntegral = localStorage.getItem("freezeIntegral");
	console.log("freezeIntegral:" + freezeIntegral);
	return freezeIntegral;
}
// 获取用户佣金 
function commission() {
	var commission = localStorage.getItem("commission");
	console.log("commission:" + commission);
	return commission;
}
// 获取用户的父ID
function parentId() {
	var parentId = localStorage.getItem("parentId");
	console.log("parentId:" + parentId);
	return parentId;
}

function add0(m) {
	return m < 10 ? '0' + m : m
}

function format(shijianchuo) {
	//shijianchuo是整数，否则要parseInt转换
	var time = new Date(shijianchuo);
	var y = time.getFullYear();
	var m = time.getMonth() + 1;
	var d = time.getDate();
	var h = time.getHours();
	var mm = time.getMinutes();
	var s = time.getSeconds();
	return y + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm) + ':' + add0(s);
}

function KeFuQQ() {
	if (plus.os.name == "iOS") {
		plus.runtime.launchApplication({
			action: "mqq://im/chat?chat_type=wpa&uin=1985597224&version=1&src_type=web"
		}, function(e) {
			plus.nativeUI.confirm("检查到您未安装qq，请先到appstore搜索下载？", function(i) {
				if (i.index == 0) {
					iosAppstore("itunes.apple.com/cn/app/mqq/");
				}
			});
		});
	} else {
		if (plus.os.name == "Android") {
			var main = plus.android.runtimeMainActivity();
			var Intent = plus.android.importClass('android.content.Intent');
			var Uri = plus.android.importClass('android.net.Uri');
			var intent = new Intent(Intent.ACTION_VIEW, Uri.parse("mqqwpa://im/chat?chat_type=wpa&uin=1985597224"));
			main.startActivity(intent);
		}
	}
}
// 获取待确认订单数量
function getConfirmOrderNum() {
	var waitConformNums = 0;
	var url = "/member/grabegg-info/getConfirmOrderNum";
	mui.ajax(
		"http://" + api + url, {
			data: {
				"memberId": mbId()
			},
			dataType: "json",
			type: 'get',
			async: false,
			success: function(data) {
				var data = data;
				console.log(data.confirmCount)
				localStorage.setItem("confirmOrderNum", data);
				waitConformNums = data;
				console.log("data.total++++++++++++++++++" + data.total);
				// localStorage.setItem("confirmOrderNum", data);
			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				console.log(errorThrown);
			}
		});
	return waitConformNums;
}
//刷新会员信息
function freshMemberInfo() {
	var url = "/member/findOfMembersInfo";
	mui.ajax(
		"http://" + api + url, {
			data: {
				mbId: mbId()
			},
			dataType: "json",
			type: 'post',
			async: false,
			success: function(data) {
				localStorage.setItem("token", data.appId);
				localStorage.setItem("mbId", data.mbId);
				localStorage.setItem("parentId", data.parentId);
				localStorage.setItem("wxRate", data.wxRate);
				localStorage.setItem("ylRate", data.ylRate);
				localStorage.setItem("ysfRate", data.ysfRate);
				localStorage.setItem("zfbRate", data.zfbRate);
				localStorage.setItem("zfblRate", data.zfblRate);
				localStorage.setItem("mbIntegral", data.mbIntegral);
				localStorage.setItem("alipayId", data.alipayId);
				localStorage.setItem("freezeIntegral", data.mbFreezeIntefral);
				localStorage.setItem("commission", data.commission);
				// 账号
				localStorage.setItem("mbName", data.mbName);
				// 用户名
				localStorage.setItem("mbLinkman", data.mbLinkman);

			},
			error: function(xhr, type, errorThrown) {
				//异常处理；
				console.log(errorThrown);
			}
		});
};

// 切换class--(.active)名
function toggleClassFn(thatObj, className) {
	var flagClass = thatObj.hasClass(className);
	// console.log(flagClass);
	if (!flagClass) {
		thatObj.addClass(className);
	} else {
		thatObj.removeClass(className);
	};
};


//目前正在使用的websocket
<!-- webScoket -->
function createWebSocket(url) {
	try {
		if ('WebSocket' in window) {
			ws = new WebSocket(url);
		} else if ('MozWebSocket' in window) {
			ws = new MozWebSocket(url);
		} else {
			mui.toast('您的浏览器不支持websocket协议,建议使用新版谷歌、火狐等浏览器，请勿使用IE10以下浏览器，360浏览器请使用极速模式，不要使用兼容模式！', {
				duration: 'long',
				type: 'div'
			});
		}
		initEventHandle(url);
	} catch (e) {
		reconnect(url);
		// console.log(e);
	}
}

function initEventHandle(url) {
	ws.onclose = function() {
		// console.log(mbId());
		// console.log("Socket已关闭");
		heartCheck.reset();
		outgraber();
	};
	ws.onerror = function() {
		mui.alert("收款时，服务器连接发生错误!", " ", "确定", function(e) {}, "div");
		// console.log("Socket发生了错误");
		setGetPlaceSatus('0');
		if (app && app.startCollectingActive) {
			app.startCollecting = "开始收款";
			app.startCollectingActive = false;
		}
		ws.close();
	};
	ws.onopen = function() {
		heartCheck.reset().start(); //心跳检测重置
		// console.log("llws连接成功!" + new Date().toUTCString());
	};
	ws.onmessage = function(event) { //如果获取到消息，心跳检测重置
		heartCheck.reset().start(); //拿到任何消息都说明当前连接是正常的
		// console.log("---> 抓单获取的数据:" + event.data);
		// console.log("数据类型:" + typeof(event.data));
		if (isJsonString(event.data))
			var data = JSON.parse(event.data);
		else
			return;
		// 如果抓单成功
		if (data.ok && data.grabeggState) {
			scanedError();

		} else {
			// 提示抓单失败, button 回原
			mui.alert(data.message, " ", "确定", function(e) {}, "div");
			ws.close();
		}
	}
	// 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
	window.onbeforeunload = function() {
		// console.log("onbeforeunload");
		heartCheck.reset();
		ws.close();
	}

	//心跳检测
	var heartCheck = {
		timeout: 8000, //8ms发一次心跳
		timeoutObj: null,
		serverTimeoutObj: null,
		reset: function() {
			clearTimeout(this.timeoutObj);
			clearTimeout(this.serverTimeoutObj);
			return this;
		},
		start: function() {
			var count = 0;
			var self = this;
			this.timeoutObj = setTimeout(function() {
				//这里发送一个心跳，后端收到后，返回一个心跳消息，
				//onmessage拿到返回的心跳就说明连接正常
				ws.send("ping");
				// console.log("ping!")
				self.serverTimeoutObj = setTimeout(function() { //如果超过一定时间还没重置，说明后端主动断开了
					reconnect(url);
					count = count + 1;
					if (count >= 10) {
						ws.close();
					}
				}, 4000)
			}, this.timeout)
		}
	}
}

function reconnect(url) {
	if (lockReconnect) return;
	lockReconnect = true;
	setTimeout(function() { //没连接上会一直重连，设置延迟避免请求过多
		if (ws)
			ws.close();
		createWebSocket(url);
		lockReconnect = false;
	}, 2000);
}

<!-- /webScoke -->

//判断str是否为json 
function isJsonString(str) {
	try {
		if (typeof JSON.parse(str) == 'object')
			return true;
	} catch (e) {
		//TODO handle the exception
	}
	return false;
}


<!-- 提示鸣声 -->
var stati = 0;

function scanedError() {
	switch (plus.os.name) { //判断设备类型
		case "iOS":
			//indexOF()字符串查找从左向右查找，lastindexOf()从右向左查找
			if (plus.device.model.indexOf("iPhone") >= 0) { //判断是否为iPhone  
				plus.device.beep();
				plus.device.vibrate();
				// console.log("设备蜂鸣中...");
			} else {
				// console.log("此设备不支持蜂鸣");
			}
			break;
		default:
			plus.device.beep();
			plus.device.vibrate();
			// console.log("设备蜂鸣中...");
			break;
	}
	//播放
	var player = null;
	var flag = false;
	if (stati == 0) {
		mui.plusReady(function() {
			if (plus.audio === 'undefined') {
				mui.toast('权限没有啊');
				return;
			}
			player = plus.audio.createPlayer("audio/dido.mp3");
			var num = player.getDuration(); //获取音频总长度number
			setTimeout(function() { //延时获取，否则可能没有返回长度
				var num = player.getDuration();
				// console.log(num);
			}, 1000)
			var volume = plus.device.getVolume();
			plus.device.setVolume(1)
			stati = 1;
			player.play(function(e) {
				// console.log('播放完成后，运行代码');
				plus.device.setVolume(volume);
				stati = 0;
			}, function(e) {
				// console.log(e);
			}, false);

		})
	}

	// console.log();
	//底部导航勋章获取
	if (app && app.orderNums || (app.orderNums == 0)) {
		// console.log("蜂鸣获取勋章");
		app.orderNums = getConfirmOrderNum().total;
		//获取页面内勋章
		if (app.toBePaid && toBeConfirm) {
			app.toBePaid = getConfirmOrderNum().paymentCount;
			app.toBeConfirm = getConfirmOrderNum().confirmCount;
		}

	}
};
<!-- /提示鸣声 -->

function setGetPlaceSatus(flag) {
	localStorage.setItem("placeSatus", flag);
}

function getGetPlaceSatus() {
	return localStorage.getItem("placeSatus");
}


//目前在使用的抓单程序
<!-- 抓单 -->
function getPlace() {
	// 创建 webscoket 连接
	ws = null; // 判断当前浏览器是否支持WebSocket
	createWebSocket(wsUrl); //连接ws
	// console.log("抓单了");
	var url = "/member/grabegg-info/new_start_grabegg?id=" + mbId();
	ajax(url, {}, function(data) {
		if (data.ok) {
			setGetPlaceSatus('1');
		} else {
			// 提示错误信息取消抓单
			mui.alert(data.message, "", function() {}, "div");
			ws.close();
		}
	}, "GET");
}
<!-- /抓单 -->

<!-- 取消抓单 -->
function outgraber() {
	// console.log("quxiao_mbId:"+mbId());
	var url = "/member/grabegg-info/cancel_grabegg?id=" + mbId();
	ajax(url, {}, function(data) {
		if (data.ok) {
			// console.log("取消订单成功");
			setGetPlaceSatus('0');
			if (app && app.startCollectingActive) {
				// console.log("取消订单成功23424");
				app.startCollecting = "开始收款";
				app.startCollectingActive = false;
			}
			mui.toast("已取消收款！");

		} else {
			mui.alert("取消失败请重试!", " ", "确定", function() {}, "div");
		}
	}, "GET");
};
<!-- /取消抓单 -->

function consolelog() {
	console.log("hello!");
}


function checkToken(token) {
	var flag;
	var url = "/checkToken"
	mui.ajax(
		"http://" + api + url, {
			data: {
				"token": token
			},
			dataType: "json",
			type: 'post',
			async: false,
			success: function(res) {
				flag = res.ok;
			}
		});
	return flag;
}

function outLoginFn() {
	console.log("============");
	if (checkToken(localStorage.getItem("token"))) {
		mui.alert('您的帐号已其他地方登录!');
		out_login();
		window.clearInterval(timer2);
		timer2 = setTimeout(outLoginFn, 3000);
	}
};
// var timer2=setTimeout(outLoginFn,3000);
var timer2 = "";

function clearTimer2() {
	window.clearInterval(timer2);
};

// 转换日期默认值
function dateFormatter(str) { //默认返回yyyy-MM-dd HH-mm-ss
	var hasTime = arguments[1] != false ? true : false; //可传第二个参数false，返回yyyy-MM-dd
	var d = new Date(str);
	var year = d.getFullYear();
	var month = (d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1);
	var day = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
	var hour = d.getHours() < 10 ? '0' + d.getHours() : d.getHours();
	var minute = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
	var second = d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds();
	if (hasTime) {
		return [year, month, day].join('-') + " " + [hour, minute, second].join(':');
	} else {
		return [year, month, day].join('-');
	};
};

// 保留小数进行四舍五入
// 超过位数的直接截取，采用四舍五入（若不采用四舍五入，截取3位，则把Math.round改为Math.floor）
function changeTwoDecimal_f(x) {
	var f_x = parseFloat(x);
	if (isNaN(f_x)) {
		return 0;
	}
	var f_x = Math.floor(x * 1000) / 1000;
	var s_x = f_x.toString();
	var pos_decimal = s_x.indexOf('.');
	if (pos_decimal < 0) {
		pos_decimal = s_x.length;
		s_x += '.';
	}
	while (s_x.length <= pos_decimal + 3) {
		s_x += '0';
	}
	if (s_x == 0) {
		return 0;
	} else {
		return s_x;
	};
};

/* ===============对浮点数加减乘除处理 start=========== */

function add(a, b) {
	var c, d, e;
	try {
		c = a.toString().split(".")[1].length;
	} catch (f) {
		c = 0;
	}
	try {
		d = b.toString().split(".")[1].length;
	} catch (f) {
		d = 0;
	}
	return e = Math.pow(10, Math.max(c, d)), (mul(a, e) + mul(b, e)) / e;
}

function sub(a, b) {
	var c, d, e;
	try {
		c = a.toString().split(".")[1].length;
	} catch (f) {
		c = 0;
	}
	try {
		d = b.toString().split(".")[1].length;
	} catch (f) {
		d = 0;
	}
	return e = Math.pow(10, Math.max(c, d)), (mul(a, e) - mul(b, e)) / e;
}

function mul(a, b) {
	var c = 0,
		d = a.toString(),
		e = b.toString();
	try {
		c += d.split(".")[1].length;
	} catch (f) {}
	try {
		c += e.split(".")[1].length;
	} catch (f) {}
	return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c);
}

function div(a, b) {
	var c, d, e = 0,
		f = 0;
	try {
		e = a.toString().split(".")[1].length;
	} catch (g) {}
	try {
		f = b.toString().split(".")[1].length;
	} catch (g) {}
	return c = Number(a.toString().replace(".", "")), d = Number(b.toString().replace(".", "")), mul(c / d, Math.pow(10, f -
		e));
}

/* ===============对浮点数加减乘除处理 end============= */


/* ================app 更新 start==================== */

//发起ajax请求检测是否有新版本

function plusReady(atuo) {
	// 获取本地应用资源版本号
	plus.runtime.getProperty(plus.runtime.appid, function(inf) {
		var wgtVer = inf.version;
		checkUpdate(wgtVer, atuo)
	});
}

function checkUpdate(wgtVer, atuo) {
	plus.nativeUI.closeWaiting();
	var url = "/getVersion";
	ajax(url, {}, function(res) {
		var flag = Version(res.version, wgtVer);
		if (!flag && !atuo) {
			mui.toast("已经最新版本");
		} else if (flag) {
			mui.confirm('检测到有新的更新？', '', ['更新', '取消'], function(e) {
				if (e.index == 0) {
					downApp(res.wgetPath); // 下载升级包
				}

			});
		}

	}, 'GET');

}

// 下载wgt文件
function downApp(wgtUrl) {
	plus.nativeUI.showWaiting("下载资源中...");
	plus.downloader.createDownload(wgtUrl, {
		filename: "_doc/update/"
	}, function(d, status) {
		if (status == 200) {
			installWgt(d.filename); // 安装wgt包
		} else {
			plus.nativeUI.alert("更新app失败！");
		}
		plus.nativeUI.closeWaiting();
	}).start();
}

// 更新应用资源
function installWgt(path) {
	plus.nativeUI.showWaiting("安装app文件...");
	plus.runtime.install(path, {}, function() {
		plus.nativeUI.closeWaiting();
		plus.runtime.restart();
	}, function(e) {
		plus.nativeUI.closeWaiting();
		plus.nativeUI.alert("安装app文件失败[" + e.code + "]：" + e.message);
	});
}
/* ================app 更新 end==================== */

/* -----------------app 版本对比 start-------------- */

function Version(curV, reqV) {

	var arr1 = curV.toString().split('.');
	var arr2 = reqV.toString().split('.');
	//将两个版本号拆成数字
	var minL = Math.min(arr1.length, arr2.length);
	var pos = 0; //当前比较位
	var diff = 0; //当前为位比较是否相等
	var flag = false;
	//逐个比较如果当前位相等则继续比较下一位
	while (pos < minL) {
		diff = parseInt(arr1[pos]) - parseInt(arr2[pos]);
		if (diff == 0) {
			pos++;
			continue;
		} else if (diff > 0) {
			flag = true;
			break;
		} else {
			flag = false;
			break;
		}
	}
	return flag;
}

/* -----------------app 版本对比 end-------------- */

function updateLoginTime(mbId){
	ajax("/member/updateLoginTime",
		{
			memberId:mbId,
		},
		 function(res) {
	}, "POST");
}
