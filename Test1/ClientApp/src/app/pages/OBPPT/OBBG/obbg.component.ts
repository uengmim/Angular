import { formatDate } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import {
  DxDataGridComponent, DxFormComponent,
  DxPopupComponent
} from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import 'devextreme/data/odata/store';
import { alert, confirm } from "devextreme/ui/dialog";
import { CommonCodeInfo, TableCodeInfo } from '../../../shared/app.utilitys';
import { CommonPossibleEntryComponent } from '../../../shared/components/comm-possible-entry/comm-possible-entry.component';
import { CodeInfoType, PossibleEnteryCodeInfo, PossibleEntryDataStoreManager } from '../../../shared/components/possible-entry-datastore';
import { TablePossibleEntryComponent } from '../../../shared/components/table-possible-entry/table-possible-entry.component';
import { ZMMBIDDtlModel } from '../../../shared/dataModel/OBPPT/ZmmBidDtl';
import { ZMMBIDMstModel, ZMMS9000Model } from '../../../shared/dataModel/OBPPT/ZmmBidMst';
import { ZMMT8370Model } from '../../../shared/dataModel/OBPPT/Zmmt8370';
import { ZMMT8510Model } from '../../../shared/dataModel/OBPPT/Zmmt8510';
import { DIMModelStatus } from '../../../shared/imate/dimModelStatusEnum';
import { ImateInfo, QueryCacheType } from '../../../shared/imate/imateCommon';
import { ImateDataService } from '../../../shared/imate/imateDataAdapter';
import { AuthService } from '../../../shared/services';
import { AppInfoService } from '../../../shared/services/app-info.service';
import { AppConfigService } from '../../../shared/services/appconfig.service';

/*입찰신청투찰 Component*/


@Component({
  templateUrl: 'obbg.component.html',
  providers: [ImateDataService]
})

export class OBBGComponent {
  @ViewChild('bidGrid', { static: false }) bidGrid!: DxDataGridComponent;

  //상단 조회조건
  biddtDate: any;
  bizNoValue: string;
  bidcstValue: number;
  //gird 데이터
  bidList!: ArrayStore;
  dtlList!: ArrayStore;

  //숨김처리변수
  loadingVisible: boolean = false;
  detailVisible: boolean = false;
  bidVisible: boolean = false;
  checkVisible: boolean = false;

  //선택 키
  selectedItemKeys: any[] = [];

  //상세내역 팝업 데이터
  detailData: any;
  //검색데이터
  searchFormData: any;
  //투찰 자재내역
  bidGridData: any;

  //투찰데이터
  bidFormData: any;

  //로그인정보
  userInfo: any;

  //입찰 닫기 버튼
  closeButtonOptions: any;
  //입찰조회 버튼
  searchButtonOptions: any;
  //입찰 저장 버튼
  saveButtonOptions: any;
  //입찰 삭제 버튼
  deleteButtonOptions: any;

  //동의 체크박스
  checkBoxValue: any;

  constructor(private appConfig: AppConfigService, private dataService: ImateDataService, private appInfo: AppInfoService, private imInfo: ImateInfo, private authService: AuthService) {
    appInfo.title = AppInfoService.APP_TITLE + " | 입찰신청투찰";

    // 로그인정보 가져오기
    this.userInfo = this.authService.getUser().data;

    this.bizNoValue = this.userInfo?.pin ?? "";

    this.bidcstValue = 0;
    this.biddtDate = formatDate(new Date(), "yyyy-MM-dd", "en-US")

    this.dataLoad();

    //팝업 닫기 버튼
    this.closeButtonOptions = {
      text: '닫기',
      onClick(e: any) {
        this.bidVisible = !this.bidVisible;
      },
    };

    //팝업 조회 버튼
    this.searchButtonOptions = {
      text: '조회',
      onClick: async (e: any) => {
        if (this.searchFormData.BIDNO == "") {
          alert("공고번호 입력 후 조회하세요.", "알림");
        } else {

        }
      },
    };
    //팝업 저장 버튼
    this.saveButtonOptions = {
      text: '저장',
      onClick: async (e: any) => {

        if (this.checkVisible && !this.checkBoxValue) {
          alert("입력하신 투찰금액에 대한 동의가 필요합니다.", "알림");
        } else {
          var seq = this.bidFormData.BIDSEQ == "" ? "001" : (parseInt(this.bidFormData.BIDSEQ) + 1).toString().padStart(3, '0');

          var model = new ZMMT8510Model(this.appConfig.mandt, this.bidFormData.BIDNO, this.authService.getUser().data?.deptId ?? "", seq, this.authService.getUser().data?.pin ?? "",
            new Date(), new Date(), this.bidFormData.GRETD, this.bidFormData.BIDCST_I, this.bidFormData.BIDVAT_I, this.bidFormData.BIDAMT_I, "KW", "", "", DIMModelStatus.Add);

          var modelList: ZMMT8510Model[] = [model];
          var result = await this.dataService.ModifyModelData<ZMMT8510Model[]>(this.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMT8510ModelList", modelList);

          var resultModel = await dataService.SelectModelData<ZMMT8510Model[]>(this.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMT8510ModelList", [],
            `MANDT = '${this.appConfig.mandt}' AND BIDNO = '${this.bidFormData.BIDNO}' AND LIFNR = '${this.authService.getUser().data?.deptId ?? ""}' AND BIDSEQ = '${seq}'`, "", QueryCacheType.None);

          if (resultModel.length > 0) {
            alert("투찰 제출이 완료되었습니다.", "알림");
            this.bidVisible = !this.bidVisible;
            this.dataLoad();
          }
        }
        //var rowCount1 = await this.dataService.ModifyModelData<ZMMT8510Model[]>(thisObj.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMT8100ModelList", mainmodelList);
      }
    }
    //팝업 삭제 버튼
    this.deleteButtonOptions = {
      text: '삭제',
      onClick: async (e: any) => {
          if (await confirm("삭제하시겠습니까?", "알림")) {
            var model = new ZMMT8510Model(this.appConfig.mandt, this.bidFormData.BIDNO, this.authService.getUser().data?.deptId ?? "", "001", this.authService.getUser().data?.pin ?? "",
              new Date(), new Date(), this.bidFormData.GRETD, this.bidFormData.BIDCST_I, this.bidFormData.BIDVAT_I, this.bidFormData.BIDAMT_I, "KW", "", "", DIMModelStatus.Delete);

            var modelList: ZMMT8510Model[] = [model];
            var result = await this.dataService.ModifyModelData<ZMMT8510Model[]>(this.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMT8510ModelList", modelList);

            var resultModel = await dataService.SelectModelData<ZMMT8510Model[]>(this.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMT8510ModelList", [],
              `MANDT = '${this.appConfig.mandt}' AND BIDNO = '${this.bidFormData.BIDNO}' AND LIFNR = '${this.authService.getUser().data?.deptId ?? ""}' AND BIDSEQ = '${this.bidFormData.BIDSEQ}'`, "", QueryCacheType.None);

            if (resultModel.length > 0) {
              alert("삭제 중 오류가 발생했습니다.", "알림");
            } else {
              alert("삭제되었습니다.", "알림");
              this.bidVisible = !this.bidVisible;
            }
          }
        
      }
    }
  }

  selectionChanged(data: any) {
    this.selectedItemKeys = data.currentSelectedRowKeys;

  }

  //리스트 조회 RFC
  public async dataLoad() {
    var zmms9000Model = new ZMMS9000Model("", "");

    var zmmbidmstModel = new ZMMBIDMstModel(zmms9000Model, this.biddtDate, new Date(2999, 1, 1), "", this.userInfo?.deptId ?? "", [], []);

    var modelList: ZMMBIDMstModel[] = [zmmbidmstModel];

    this.loadingVisible = true;
    var resultModel = await this.dataService.RefcCallUsingModel<ZMMBIDMstModel[]>(this.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMBIDMstModelList", modelList, QueryCacheType.None);
    this.loadingVisible = false;

    if (resultModel[0].ES_RESULT.TYPE !== "S") {
      alert(`자료를 가져오지 못했습니다.\n\nSAP 메시지: ${resultModel[0].ES_RESULT.MESSAGE}`, "알림");
      this.bidList = new ArrayStore({
        key: ['BIDNO'],
        data: resultModel[0].ET_DATA

      });
    }
    else {
      this.bidList = new ArrayStore({
        key: ['BIDNO'],
        data : resultModel[0].ET_DATA
        
      });
    }
  }


  //투찰 저장
  public async savdData() {

    if (this.checkVisible && !this.checkBoxValue) {
      alert("입력하신 투찰금액에 대한 동의가 필요합니다.", "알림");
    } else {
      var seq = this.bidFormData.BIDSEQ == "" ? "001" : (parseInt(this.bidFormData.BIDSEQ) + 1).toString().padStart(3, '0');

      var model = new ZMMT8510Model(this.appConfig.mandt, this.bidFormData.BIDNO, this.authService.getUser().data?.deptId ?? "", seq, this.authService.getUser().data?.pin ?? "",
        new Date(), new Date(), this.bidFormData.GRETD, this.bidFormData.BIDCST_I, this.bidFormData.BIDVAT_I, this.bidFormData.BIDAMT_I, "", "", "", DIMModelStatus.Add);

      var modelList: ZMMT8510Model[] = [];
      var result = await this.dataService.ModifyModelData<ZMMT8510Model[]>(this.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMT8510ModelList", modelList);

      if (result > 0) {
        alert("투찰 제출이 완료되었습니다.", "알림");
        this.bidVisible = !this.bidVisible;
        this.dataLoad();
      }
    }
  }

  searchData() {
    this.dataLoad();

  }
  async DetailData() {
    this.detailVisible = !this.detailVisible;
    var selectData = this.bidGrid.instance.getSelectedRowsData()[0];
    this.detailData = selectData;
    this.detailData.BIZNO = this.userInfo?.pin ?? "";
    this.detailData.NAME1 = this.userInfo?.deptName ?? "";


    var result = await this.detaildataLoad(selectData.BIDNO, selectData.REQSEQ);

    this.dtlList = new ArrayStore({
      key: ['BIDNO'],
      data: result.ET_DATA

    });
  }
  async Bid() {

    var selectData = this.bidGrid.instance.getSelectedRowsData()[0];
    /*if (selectData.BIDST != "3" || selectData.S_BIDRST != "I") {
      alert("투찰이 불가능합니다.", "알림");
    } else {
    */
    this.bidFormData = selectData;

    this.bidFormData.BIZNO = this.userInfo?.pin ?? "";
    this.bidFormData.NAME1 = this.userInfo?.deptName ?? "";

    var result = await this.detaildataLoad(selectData.BIDNO, selectData.REQSEQ);

    this.bidGridData = new ArrayStore({
      key: ['MATNR'],
      data: result.ET_DATA

    });

    this.bidVisible = !this.bidVisible;
    //}
  }

  // 상세 데이터 로드
  public async detaildataLoad(BIDNO : string, REQSEQ : string) {


    var zmms9000Model = new ZMMS9000Model("", "");

    var zmmbiddtlModel = new ZMMBIDDtlModel(zmms9000Model, BIDNO, "0000600033", REQSEQ, []);

    var modeldtlList: ZMMBIDDtlModel[] = [zmmbiddtlModel];

    var result = await this.dataService.RefcCallUsingModel<ZMMBIDDtlModel[]>(this.appConfig.dbTitle, "NBPDataModels", "NAMHE.Model.ZMMBIDDtlModelList", modeldtlList, QueryCacheType.None);

    return result[0]

  }
  amt(e: any) {
    /*if (e.value > this.bidFormData.RFQCST) {
      alert("견적가 이상 입력이 불가능합니다.", "알림");
      e.component.option('value', 0);  
    }
    else {
    */
    if (this.bidFormData.VATTY == "OUT") {
      this.bidFormData.BIDCST_I = e.value;
      this.bidFormData.BIDVAT_I = Math.floor(e.value * 0.1) / 10 * 10;
      this.bidFormData.BIDAMT_I = this.bidFormData.BIDCST_I + this.bidFormData.BIDVAT_I;
    }
    else {
      this.bidFormData.BIDCST_I = e.value;
      this.bidFormData.BIDVAT_I = 0;
      this.bidFormData.BIDAMT_I = e.value;
    }
    if (parseInt(this.bidFormData.BIDAMT_I) < parseInt(this.bidFormData.RFQAMT) * 0.7) {
      alert("총 금액차이 70%이상입니다.", "투찰금액 알림");
      this.checkVisible = true;
    }
    //}
  }
}