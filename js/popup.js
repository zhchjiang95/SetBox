const bgWindow = chrome.extension.getBackgroundPage();
const popupInit = {
  translate() {
    new ClipboardJS(".btn-sm");
    const tr = new Map([
      ["zh-Hans", "中文（简体）"],
      ["en", "英语"],
    ]);
    let timer;
    let copyTimer;
    let token = "bKq9SKrj94cYOZjLD0aS3GrD3hdF8q5Y";
    let key = "1665478121981";

    fetch("https://cn.bing.com/translator?ref=TThis&text=&from=zh-Hans&to=en")
      .then((res) => res.text())
      .then((res) => {
        const reg = /(?<=params_AbusePreventionHelper = \[).*?(?=",)/;
        const r = res.match(reg)[0];
        const result = r?.split(',"');
        token = result?.[1];
        key = result?.[0];
      });

    $(".tr-toggle").hide();
    $(".spinner-border").hide();
    $(".copy-success").hide();
    $(".translation").on("input", function (e) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const val = e.target.value;
        $(".result button").remove();
        if (val !== undefined && val !== null && val !== "") {
          $(".empty").hide();
          $(".spinner-border").show();
          onTranslation(val);
        } else {
          $(".tr-toggle").hide();
          $(".empty").text("翻译").show();
        }
      }, 1000);
    });

    $(".tr-toggle").on("click", ".toggle-btn", function () {
      $(".result button").remove();
      $(".empty").hide();
      $(".spinner-border").show();
      onTranslation($("textarea").val(), $(".type-2").data("tr"));
    });

    $(".result").on("click", ".btn-sm", function () {
      clearTimeout(copyTimer);
      $(".copy-success div")
        .text($(this).text() + " 已复制到剪切板！")
        .parent()
        .show();
      copyTimer = setTimeout(function () {
        $(".copy-success").hide();
      }, 2000);
    });

    const onTranslation = (value, f) => {
      const pattern = new RegExp("[\u4E00-\u9FA5]+");
      const from = f ? f : pattern.test(value) ? "zh-Hans" : "en";
      const to = from === "en" ? "zh-Hans" : "en";
      const p = `&isVertical=1&IG=9B029BBF312D4BC593DB3D0530630910&text=${encodeURIComponent(
        value
      )}&to=${to}&token=${token}&key=${key}`;
      const url1 = `https://cn.bing.com/tlookupv3?IID=translator.5022.2&from=${from}`;
      const url2 =
        "https://cn.bing.com/ttranslatev3?isVertical=1&IG=9B029BBF312D4BC593DB3D0530630910&IID=translator.5022.5";

      $(".type-1").text(tr.get(from)).data("tr", from);
      $(".type-2").text(tr.get(to)).data("tr", to);
      $(".tr-toggle").show();

      const bkRequest = () => {
        fetch(url2, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `text=${value}&to=${to}&token=${token}&key=${key}&fromLang=${from}`,
        })
          .then((res) => res.json())
          .then((res) => {
            $(".spinner-border").hide();
            if (res?.[0]?.translations.length) {
              splicingResult(res?.[0]?.translations, "text");
            } else {
              $(".empty")
                .text("暂无翻译结果，请关注公众号Slothful获取版本更新。")
                .show();
            }
          })
          .catch(() => {
            $(".spinner-border").hide();
            $(".empty")
              .text("翻译失败（网络异常或开启VPN后可能会出现此问题）")
              .show();
          });
      };

      fetch(url1 + p, {
        method: "POST",
      })
        .then((res) => res.json())
        .then((res) => {
          if (res?.[0]?.translations.length) {
            $(".spinner-border").hide();
            splicingResult(res?.[0]?.translations, "displayTarget");
          } else {
            bkRequest();
          }
        })
        .catch(() => {
          bkRequest();
        });
    };

    const splicingResult = (arr, key) => {
      const btns = arr.map(
        (v) =>
          `<button type="button" class="btn btn-outline-success btn-sm" data-clipboard-text="${v[key]}"><i class="ri-file-copy-2-line"></i>${v[key]}</button>`
      );
      $(".result").append(btns).show();
    };
  },
  // 开关类事件
  rest() {
    $("#translate-tools").show();
    $("#rest-tools").hide();

    $("#transBtn").click(() => {
      $("#translate-tools").show();
      $("#rest-tools").hide();
    });
    $("#restBtn").click(() => {
      $("#translate-tools").hide();
      $("#rest-tools").show();
    });

    const sendMessage = (p) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, p, function (response) {
          console.log(response);
        });
      });
    };

    $(".form-check-input").click(function () {
      const ty = this.checked ? "show" : "hide";
      switch ($(this).data("type")) {
        case "previewPics":
          sendMessage({ previewPics: ty });
          break;
        case "autoScrolling":
          sendMessage({ autoScrolling: ty });
          break;
        case "editMode":
          sendMessage({ editMode: ty });
          break;
        case "timingRequest":
          let t = 20;
          if (ty === "show") {
            t =
              Number(
                prompt(
                  "请输入时间间隔（单位秒，默认20秒，留空或点击取消按钮将每20秒会重复刷新页面。请谨慎设置过小的时间间隔！为防止内存泄漏请尽量在开启处拨动开关以停止刷新！）："
                )
              ) || 20;
          }
          bgWindow.backgroundInit.interval(ty, t);
          break;
        case "grayscale":
          sendMessage({ grayscale: ty });
          break;
      }
    });
  },
  // 功能类事件
  onFeatHandler() {
    $(".feat-item").click(function () {
      const { featType } = $(this).data();
      $(".offcanvas .contnet").find(".list-group").remove();
      $(".offcanvas .contnet").find("textarea").hide();
      $(".offcanvas .offcanvas-title").text($(this).find("span").text());
      switch (featType) {
        case "pinyin":
          let timer;
          $(".offcanvas .contnet").find("textarea").show().val("");
          $("#toPinyin").on("input", function () {
            clearTimeout(timer);
            timer = setTimeout(() => {
              const value = $(this).val();
              if (value) {
                const results = pinyinUtil.getPinyin(value, " ", true, true);
                let listr = "";
                results.forEach((v) => {
                  listr += `<li class="list-group-item d-flex justify-content-between align-items-center">${v}</li>`;
                });
                const ulstr = `<ul style="margin: 8px 0" class="list-group">${listr}</ul>`;
                $(".offcanvas .contnet")
                  .find(".list-group")
                  .remove()
                  .end()
                  .append(ulstr);
              } else {
                $(".offcanvas .contnet").find(".list-group").remove();
              }
            }, 800);
          });
          break;
      }
    });
  },
  // 计算器功能
  calculator() {
    const $input = $("#calculatorInput");
    const $result = $(".calculator-result");
    const $resultValue = $(".result-value");

    // 自定义数学表达式解析器（不使用eval，符合CSP）
    const calculate = (expression) => {
      // 移除所有空格
      const expr = expression.replace(/\s/g, "");
      
      // 检查是否只包含允许的字符
      if (!/^[0-9+\-*/().]+$/.test(expr)) {
        throw new Error("包含非法字符");
      }
      
      if (!expr) {
        return null;
      }

      // 词法分析：将表达式转换为token数组
      const tokenize = (str) => {
        const tokens = [];
        let num = "";
        
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          
          if (/[0-9.]/.test(char)) {
            num += char;
          } else {
            if (num) {
              tokens.push(parseFloat(num));
              num = "";
            }
            tokens.push(char);
          }
        }
        
        if (num) {
          tokens.push(parseFloat(num));
        }
        
        return tokens;
      };

      // 语法分析和计算
      const tokens = tokenize(expr);
      let pos = 0;

      const parseExpression = () => {
        let left = parseTerm();
        
        while (pos < tokens.length && (tokens[pos] === "+" || tokens[pos] === "-")) {
          const op = tokens[pos++];
          const right = parseTerm();
          left = op === "+" ? left + right : left - right;
        }
        
        return left;
      };

      const parseTerm = () => {
        let left = parseFactor();
        
        while (pos < tokens.length && (tokens[pos] === "*" || tokens[pos] === "/")) {
          const op = tokens[pos++];
          const right = parseFactor();
          left = op === "*" ? left * right : left / right;
        }
        
        return left;
      };

      const parseFactor = () => {
        const token = tokens[pos];
        
        // 处理负数
        if (token === "-") {
          pos++;
          return -parseFactor();
        }
        
        // 处理正数
        if (token === "+") {
          pos++;
          return parseFactor();
        }
        
        // 处理括号
        if (token === "(") {
          pos++;
          const result = parseExpression();
          if (tokens[pos] === ")") {
            pos++;
          }
          return result;
        }
        
        // 处理数字
        if (typeof token === "number") {
          pos++;
          return token;
        }
        
        throw new Error("语法错误");
      };

      const result = parseExpression();
      
      if (!isFinite(result)) {
        throw new Error("计算结果无效");
      }
      
      return result;
    };

    // 监听输入事件
    $input.on("input", function () {
      const expression = $(this).val();

      // 如果输入为空，隐藏结果
      if (!expression || !expression.trim()) {
        $result.removeClass("show error");
        return;
      }

      try {
        const result = calculate(expression);

        if (result !== null) {
          // 格式化结果（保留最多8位小数，去除尾部0）
          const formattedResult = parseFloat(result.toFixed(8));
          $resultValue.text(formattedResult);
          $result.removeClass("error").addClass("show");
        }
      } catch (error) {
        // 显示错误提示
        console.error("Calculator error:", error);
        $resultValue.text("表达式错误");
        $result.removeClass("show").addClass("error show");
      }
    });

    // 支持回车键保存历史记录
    $input.on("keypress", function (e) {
      if (e.which === 13) {
        // Enter键
        const expression = $(this).val().trim();
        const resultText = $resultValue.text();
        
        if (expression && resultText && !$result.hasClass("error")) {
          // 创建历史记录项
          const historyItem = $(`
            <div class="history-item">
              <span class="expression">${expression}</span>
              <span class="result">= ${resultText}</span>
            </div>
          `);
          
          // 添加到历史记录区域（最新的在最上面）
          $("#calculatorHistory").prepend(historyItem);
          
          // 清空输入框和结果
          $(this).val("");
          $result.removeClass("show error");
        }
      }
    });
  },
};

popupInit.translate();
popupInit.rest();
popupInit.onFeatHandler();
popupInit.calculator();
