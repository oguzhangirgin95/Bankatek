import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BaseComponent } from '@lib/base/basecomponent/basecomponent';
import { CustomerControllerService } from '@lib/services/api/customerController.service';
import { RegionControllerService } from '@lib/services/api/regionController.service';
import { TransferControllerService } from '@lib/services/api/transferController.service';
import { BranchControllerService } from '@lib/services/api/branchController.service';
import { Card } from '@lib/commons/card/card';
import { Input } from '@lib/commons/input/input';
import { Select } from '@lib/commons/select/select';

@Component({
  imports: [Card, FormsModule, Input, Select],
  templateUrl: './transfercreate.start.html',
  styleUrl: './transfercreate.scss',
})
export class TransfercreateStart extends BaseComponent implements OnInit {
  private readonly transferService = inject(TransferControllerService);
  private readonly customerService = inject(CustomerControllerService);
  private readonly regionService = inject(RegionControllerService);
  private readonly branchService = inject(BranchControllerService);

  readonly labels = computed(() => ({
    title: this.getResource('TRANSFERCREATE_TITLE', 'Transfer Oluştur'),
    city: this.getResource('FILTER_CITY', 'Şehir'),
    branch: this.getResource('FILTER_BRANCH', 'Şube'),
    all: this.getResource('FILTER_ALL', 'Tümü'),
    customer: this.getResource('TRANSFERCREATE_CUSTOMER', 'Gönderen müşteri'),
    type: this.getResource('FILTER_TRANSFERTYPE', 'Transfer tipi'),
    receiverName: this.getResource('TRANSFERCREATE_RECEIVER', 'Alıcı adı'),
    receiverIban: this.getResource('TRANSFERCREATE_RECEIVERIBAN', 'Alıcı IBAN'),
    amount: this.getResource('GRID_AMOUNT', 'Tutar'),
    description: this.getResource('TRANSFERCREATE_DESCRIPTION', 'Açıklama'),
    formTitle: this.getResource('TRANSFERCREATE_FORM', 'Transfer bilgileri'),
    hint: this.getResource('TRANSFERCREATE_HINT', 'Devam ile onay ekranına geçilir.'),
  }));

  constructor() {
    super();
  }

  ngOnInit() {
    if (!this.State.Request) {
      this.State.Request = {
        customerId: '',
        type: '',
        receiverName: '',
        receiverIban: 'TR',
        amount: '',
        description: '',
      };

      this.State.Filter = { cityId: '', branchId: '' };
    }

    this.getCityList();
    this.getBranchList();
    this.getTypeList();
    this.getCustomerList();
  }

  getCityList() {
    this.once('CityList', () => firstValueFrom(this.regionService.regionList({})))
      .then((response) => {
        this.State.CityList = (response?.regions ?? []).map((city) => ({ value: city.id, text: city.name }));
      })
      .catch((error) => console.error('City list:', error));
  }

  getBranchList() {
    this.once(`BranchList:${this.State.Filter.cityId}`, () => firstValueFrom(this.branchService.branchList({ cityId: this.State.Filter.cityId })))
      .then((response) => {
        this.State.BranchList = (response?.branches ?? []).map((branch) => ({ value: branch.id, text: branch.name }));
      })
      .catch((error) => console.error('Branch list:', error));
  }

  getTypeList() {
    this.once('TransferTypeList', () => firstValueFrom(this.transferService.transferTypeList({})))
      .then((response) => {
        this.State.TypeList = (response?.types ?? []).map((type) => ({ value: type.key, text: type.name }));
      })
      .catch((error) => console.error('Transfer types:', error));
  }

  getCustomerList() {
    firstValueFrom(this.customerService.customerList({ cityId: this.State.Filter.cityId, branchId: this.State.Filter.branchId }))
      .then((response) => {
        this.State.CustomerList = (response?.customerList ?? []).map((customer) => ({
          value: customer.id,
          text: `${customer.customerNumber} - ${customer.fullName}`,
        }));
      })
      .catch((error) => console.error('Customer list:', error));
  }

  setFilter(key: string, value: string) {
    this.State.Filter[key] = value;

    if (key === 'cityId') {
      this.State.Filter.branchId = '';
      this.getBranchList();
    }

    this.State.Request.customerId = '';
    this.getCustomerList();
  }
}
