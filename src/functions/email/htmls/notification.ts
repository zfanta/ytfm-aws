export default
`
<html>
<head>
  <title>
    {{videoTitle}}
  </title>
  <style type="text/css">
      * {
          font-family: arial, Arial, sans-serif;
      }
      @media only screen and (max-device-width: 480px) {
          body.suppress-border-on-mobile {
              margin: 0 !important;
              border: 0 !important;
              padding: 0 !important;
          }

          table.outer-container-width, td.outer-container-width {
              width: 640px !important;
          }

          table.inner-container-width, td.inner-container-width {
              width: 600px !important;
          }

          td.footer-font, div.footer-font {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table.large-section-padding-height, td.large-section-padding-height {
              height: 16px !important;
          }

          table.content-container-width, td.content-container-width {
              width: 540px !important;
          }

          a.video-link-font-class, div.video-link-font-class, td.video-link-font-class {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table.video-spotlight-width {
              width:600px !important;
              height:332px !important;
          }

      }
  </style>
  <style type="text/css">
      * {
          font-family: arial, Arial, sans-serif;
      }
      @media only screen and (max-device-width: 480px) {
          body[class=suppress-border-on-mobile] {
              margin: 0 !important;
              border: 0 !important;
              padding: 0 !important;
          }

          table[class=outer-container-width], td[class=outer-container-width] {
              width: 640px !important;
          }

          table[class=inner-container-width], td[class=inner-container-width] {
              width: 600px !important;
          }

          td[class=footer-font], div[class=footer-font] {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table[class=large-section-padding-height], td[class=large-section-padding-height] {
              height: 16px !important;
          }

          table[class=content-container-width], td[class=content-container-width] {
              width: 540px !important;
          }

          a[class=video-link-font-class], div[class=video-link-font-class], td[class=video-link-font-class] {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table[class=video-spotlight-width] {
              width:600px !important;
              height:332px !important;
          }

          table, td. {
              width: 500px !important;
          }
      }
  </style>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body class="suppress-border-on-mobile">
<table class="outer-container-width" width="680" bgcolor="transparent" align="center" valign="top" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td class="inner-container-width" width='600'>
      <table class="inner-container-width" width='600' align="center" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <table class="inner-container-width" width='600' align="center" valign="center" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td>
                  <table class="video-spotlight-width" width="600" align="center" cellspacing="0" cellpadding="0" border="0">
                    <tr style="mso-hide:all">
                      <td colspan="3">
                        <a href="https://www.youtube.com/watch?v={{videoId}}" style="text-decoration:none; display:block;" class="nonplayable">
                          <table aria-label="{{videoTitle}}" class="video-spotlight-width" width="600" align="center" background="{{thumbnail}}"  style="background-repeat:no-repeat;background-size:cover;background-position:center;mso-hide:all" height="338" cellspacing="0" cellpadding="0" border="0">
                            <tr aria-label="{{videoTitle}}" scope="row" style="mso-hide:all">
                              <td  aria-label="{{videoTitle}}" class="footer-font" style="color:#fff; text-align:right; font-size: 12px;" valign="bottom" width="600">
                                <div style="margin-bottom:8px; margin-right:8px; border-radius:2px; background-color: #212121; padding:2px 4px; display:inline-block;">{{duration}}</div>
                              </td>
                            </tr>
                          </table>
                        </a>
                      </td>
                    </tr>
                    <tr><td>
                      <table class="large-section-padding-height" height="16" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td class="large-section-padding-height" height="16"></td>
                        </tr>
                      </table>
                    </td></tr>
                    <tr>
                      <td>
                        <table class="content-container-width" width="600" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                          <tr>
                            <td >
                              <table class="content-container-width" width="600" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                                <td valign="center" >
                                  <table class="content-container-width" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                                    <tr>
                                      <td style="padding-bottom:4px">
                                        <a href="https://www.youtube.com/watch?v={{videoId}}" style="text-decoration:none;">
<span class="video-title-font-class" valign="center" style="font-family:Roboto,sans-serif; font-size:14px; color:#212121; line-height:20px; -webkit-text-size-adjust:none;">
  {{videoTitle}}
</span>
                                        </a>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <a class="video-link-font-class" href="https://www.youtube.com/channel/{{channelId}}" style="font-family:Roboto,sans-serif;font-size:12px; color: #757575;; line-height:16px; letter-spacing:0px; -webkit-text-size-adjust:none; text-decoration:none;">
                                          {{channelTitle}}
                                        </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`
