import { Component } from '@angular/core';
import { AppInfoService } from '../../shared/services/app-info.service';
import { locale, loadMessages } from "devextreme/localization";

@Component({
  templateUrl: 'home.component.html',
  styleUrls: [ './home.component.scss' ]
})

export class HomeComponent {
  constructor(private appInfo: AppInfoService) {
    appInfo.title = AppInfoService.APP_TITLE + " | Home";
    locale(navigator.language);

  }
}
